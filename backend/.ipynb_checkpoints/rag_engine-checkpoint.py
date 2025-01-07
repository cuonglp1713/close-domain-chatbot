import logging
import os
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer
from config import *

class RAGEngine():
    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
        self.logger.setLevel(logging.INFO)
        
        self.client = QdrantClient(url=QDRANT_URL)
        
        self.law_retriever = SentenceTransformer(LAW_RETRIEVER)
        self.wiki_retriever = SentenceTransformer(WIKI_RETRIEVER)
        self.medical_retriever = SentenceTransformer(MEDICAL_RETRIEVER)

    def create_client(self):
        client = QdrantClient(url=QDRANT_URL)
        return client

    def get_enhance_info(self, query, collection):
        '''
        Get top 1 relevant docs for enhancing query
        Return dict with keys: ['text', 'url']
        '''

        if collection == 'law':
            collection = QDRANT_LAW_COLLECTION
            query_vector = self.law_retriever.encode(query, max_length=VECTOR_DIM, convert_to_tensor=True)
        elif collection == 'wiki':
            collection = QDRANT_WIKI_COLLECTION
            query_vector = self.wiki_retriever.encode(query, max_length=VECTOR_DIM, convert_to_tensor=True)
        elif collection == 'medical':
            collection = QDRANT_MEDICAL_COLLECTION
            query_vector = self.medical_retriever.encode(query, max_length=VECTOR_DIM, convert_to_tensor=True)
            
        print('Collection:', collection)

        try:
            results = self.client.search(
                collection_name=collection,
                query_vector=query_vector,
                limit=1
            )
        except Exception as e:
            raise e
        
        text = [result.payload['text'] for result in results]
        url = [result.payload['url'] for result in results]              
            
        return {'text': text,
                'url': url}