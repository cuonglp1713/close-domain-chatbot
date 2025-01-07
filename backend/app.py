from fastapi import FastAPI, HTTPException
import uvicorn

from chatbot import LLMChatBot
from pydantic import BaseModel

from fastapi.middleware.cors import CORSMiddleware

import time

def format_ouput(query, response, metadata):
    response = dict()
    response['user_message'] = query
    response['bot_response'] = response
    response['bot_refer'] = []

    if metadata == '':
        pass
    else:
        ref = dict()
        ref['url'] = metadata['url']
        ref['content'] = metadata['text']
        
        response['bot_refer'].append(ref)

    return response


# FastAPI app
app = FastAPI(debug=True)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Địa chỉ frontend
    allow_credentials=True,
    allow_methods=["*"],  # Cho phép tất cả các phương thức (GET, POST, ...)
    allow_headers=["*"],  # Cho phép tất cả các headers
)

# LLM
llm = LLMChatBot()


class Message(BaseModel):
    conversation_id: int
    content: str
    collection: str = 'law'


@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/chat")
async def get_response(message: Message):
    try:
        user_message = message.content
        conversation_id = str(message.conversation_id)
        user_collection = message.collection
        print(user_message)
        print(conversation_id)
        print(user_collection)
        response = llm.get_response(conversation_id, user_message, user_collection)
        response = format_ouput(user_message, response['response'], response['metadata'])

        return response
    except Exception as e:
        raise e


if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=8007, log_level='info')