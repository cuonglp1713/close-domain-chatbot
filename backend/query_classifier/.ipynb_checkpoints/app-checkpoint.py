import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os
import glob
import random
import ast
from sklearn.model_selection import train_test_split
from datetime import datetime
import time

from tqdm.notebook import tqdm

import wandb

from config import *

from datasets import load_dataset, Dataset, DatasetDict
from huggingface_hub.hf_api import HfFolder
HfFolder.save_token(HF_TOKEN)

import os
os.environ['CUDA_DEVICE_ORDER'] = "PCI_BUS_ID"
os.environ['CUDA_VISIBLE_DEVICES'] = '2'

from transformers import BertTokenizer, BertForSequenceClassification
import torch
from keras.preprocessing.sequence import pad_sequences
from torch.utils.data import TensorDataset, DataLoader, SequentialSampler

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel
from fastapi.responses import JSONResponse


# use CUDA
if torch.cuda.is_available():
    device = torch.device("cuda")
else: 
    raise Exception("CUDA not available!")

# Load model
model = BertForSequenceClassification.from_pretrained(CLASSIFICATION_MODEL)
tokenizer = BertTokenizer.from_pretrained(CLASSIFICATION_MODEL)
model.to(device)
model.eval()

def predict(sentences):
    # Adding special tokens at the start and end of each sentence for BERT to work properly
    sentences = ["[CLS] " + sentence + " [SEP]" for sentence in sentences]
    # labels = df.label.values

    tokenized_texts = [tokenizer.tokenize(sent) for sent in sentences]

    # Use the BERT tokenizer to convert the tokens to their index numbers in the BERT vocabulary
    input_ids = [tokenizer.convert_tokens_to_ids(x) for x in tokenized_texts]
    # Pad our input tokens
    input_ids = pad_sequences(input_ids, maxlen=MAX_LENGTH, dtype="long", truncating="post", padding="post")
    # Create attention masks
    attention_masks = []

    # Create a mask of 1s for each token followed by 0s for padding
    for seq in input_ids:
        seq_mask = [float(i>0) for i in seq]
        attention_masks.append(seq_mask) 

    prediction_inputs = torch.tensor(input_ids)
    prediction_masks = torch.tensor(attention_masks)
    # prediction_labels = torch.tensor(labels)

    batch_size = 32  


    prediction_data = TensorDataset(prediction_inputs, prediction_masks)#, prediction_labels)
    prediction_sampler = SequentialSampler(prediction_data)
    prediction_dataloader = DataLoader(prediction_data, sampler=prediction_sampler, batch_size=batch_size)

    # Prediction on test set



    # Tracking variables 
    predictions  = [] # , true_labels = []

    # Predict 
    for batch in prediction_dataloader:
        # Add batch to GPU
        batch = tuple(t.to(device) for t in batch)
        # Unpack the inputs from our dataloader
        b_input_ids, b_input_mask = batch #, b_labels
        # Telling the model not to compute or store gradients, saving memory and speeding up prediction
        with torch.no_grad():
            # Forward pass, calculate logit predictions
            logits = model(b_input_ids, token_type_ids=None, attention_mask=b_input_mask)

        # Move logits and labels to CPU
        logits = logits['logits'].detach().cpu().numpy()
    #     label_ids = b_labels.to('cpu').numpy()

        # Store predictions and true labels
        predictions.append(logits)
    #     true_labels.append(label_ids)
    pred_flat = np.argmax(predictions, axis=2).flatten()

    classes = ['dialog', 'law', 'medical', 'wiki']
    return [classes[pred] for pred in pred_flat]

def process_text(text):
    text = text.strip()
    if text.endswith('?'):
        return text

    end_marks = ('.', ',', '!', '...', ':', ';', '–', '-', ')')
    if text.endswith(end_marks):
        if text.endswith('...'):
            text = text[:-3]
        else:
            text = text[:-1]
    return text + '?'


# FastAPI app
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Địa chỉ frontend
    allow_credentials=True,
    allow_methods=["*"],  # Cho phép tất cả các phương thức (GET, POST, ...)
    allow_headers=["*"],  # Cho phép tất cả các headers
)

class QueryRequest(BaseModel):
    query: str

@app.post('/query')
async def query(request: QueryRequest):
    query = request.query
    query = process_text(query)
    predicted_query = predict([query])[0]

    return JSONResponse(content={'class': predicted_query})


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8006)