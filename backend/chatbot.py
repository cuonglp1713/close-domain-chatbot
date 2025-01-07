import shutil
import gradio as gr
import requests
import logging
import uuid 
import os
os.environ['CUDA_DEVICE_ORDER'] = "PCI_BUS_ID"
os.environ['CUDA_VISIBLE_DEVICES'] = '2'

from vllm import LLM, SamplingParams
from vllm.lora.request import LoRARequest

from config import *

from rag_engine import RAGEngine

from huggingface_hub.hf_api import HfFolder
from huggingface_hub import snapshot_download
HfFolder.save_token(HF_TOKEN)


class LLMChatBot():
    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
        self.logger.setLevel(logging.INFO)
        # self.chat_session_id = chat_session_id

        self.rag_engine = RAGEngine()

        self.base_model = LLM(
            model=BASE_MODEL,
            enable_lora=True,
            max_lora_rank=64,
            gpu_memory_utilization=0.8,
            # tensor_parallel_size=2
        )
        self.sampling_params = SamplingParams(
            temperature=0.5,
            top_p=0.95,
            max_tokens=1024, 
            min_tokens=2, 
            stop=['<|end_of_text|>'],
            skip_special_tokens=False
        )

        self.law_lora = snapshot_download(repo_id=LAW_LORA)
        self.wiki_lora = snapshot_download(repo_id=WIKI_LORA)
        self.medical_lora = snapshot_download(repo_id=MEDICAL_LORA)

    def push_query_to_chat_session(self, query):
        payload = {
            'query': query
        }
        response = requests.post(QUERY_HANDLER_URL + 'query', json=payload)

        return response.json()

    def process_prompt(self, SYSTEM_PROMPT, context, query):
        if len(context) == 1:
            PROMPT = SYSTEM_PROMPT + f'\nNgữ cảnh: {context[0]}\nCâu hỏi: {query}\n'
        else:
            pass
    
        return PROMPT

    def get_response(self, chat_session_id, query, collection):
        '''
        Get llm response
        Collection: [law, wiki, medical]
        '''      
        push_query_respones = self.push_query_to_chat_session(query)

        print('Query:', query)
        print('Collection:', collection)
        
        collection_pred = push_query_respones['class']
        
        if collection == 'law':
            SYSTEM_PROMPT = LAW_SYSTEM_PROMPT
            
            if collection_pred == 'wiki' or collection_pred == 'medical':
                response = 'Xin lỗi kiến thức của tôi chỉ hỗ trợ trong việc trả lời câu hỏi về lĩnh vực PHÁP LUẬT!'              
                return {'response': response, 'metadata': None}
            else:
                retrieved_data = self.rag_engine.get_enhance_info(query, collection)
                enhance_query = self.process_prompt(SYSTEM_PROMPT, retrieved_data['text'], query)
        
                response = self.base_model.generate(
                    enhance_query,
                    self.sampling_params,
                    lora_request=LoRARequest("adapter", 1, self.law_lora)
                )[0].outputs[0].text
                
                return {'response': response, 'metadata': retrieved_data}

        elif collection == 'wiki':
            SYSTEM_PROMPT = WIKI_SYSTEM_PROMPT
            
            if collection_pred == 'law' or collection_pred == 'medical':
                response = 'Xin lỗi kiến thức của tôi chỉ hỗ trợ trong việc trả lời câu hỏi về lĩnh vực CHUNG!'
                return {'response': response, 'metadata': None}
            else:
                retrieved_data = self.rag_engine.get_enhance_info(query, collection)
                enhance_query = self.process_prompt(SYSTEM_PROMPT, retrieved_data['text'], query)
        
                response = self.base_model.generate(
                    enhance_query,
                    self.sampling_params,
                    lora_request=LoRARequest("adapter", 1, self.wiki_lora)
                )[0].outputs[0].text
                
                return {'response': response, 'metadata': retrieved_data}

        elif collection == 'medical':
            SYSTEM_PROMPT = MEDICAL_SYSTEM_PROMPT
            
            if collection_pred == 'law' or collection_pred == 'wiki':
                response = 'Xin lỗi kiến thức của tôi chỉ hỗ trợ trong việc trả lời câu hỏi về lĩnh vực Y TẾ!'
                return {'response': response, 'metadata': None}
            else:
                retrieved_data = self.rag_engine.get_enhance_info(query, collection)
                enhance_query = self.process_prompt(SYSTEM_PROMPT, retrieved_data['text'], query)
        
                response = self.base_model.generate(
                    enhance_query,
                    self.sampling_params,
                    lora_request=LoRARequest("adapter", 1, self.medical_lora)
                )[0].outputs[0].text
                
                return {'response': response, 'metadata': retrieved_data}       