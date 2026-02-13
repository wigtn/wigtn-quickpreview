from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import logging
from openai import AsyncOpenAI
from supabase import create_client, Client

# 환경 변수 로드
load_dotenv()

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI 앱 초기화
app = FastAPI(title="WIGTN AI Service", version="1.0.0")

# CORS 설정 (필요한 경우)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 프로덕션에서는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 환경 변수 설정
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

# OpenAI 클라이언트 초기화
openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)

# Supabase 클라이언트 초기화
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# 요청 모델 정의
class MessageRequest(BaseModel):
    message: str
    conversation_id: str | None = None

class MessageResponse(BaseModel):
    response: str
    conversation_id: str

# Health check 엔드포인트
@app.get("/health")
async def health_check():
    """헬스 체크 엔드포인트"""
    return {
        "status": "healthy",
        "service": "wigtn-ai-service",
        "version": "1.0.0"
    }

# AI 응답 엔드포인트
@app.post("/api/chat", response_model=MessageResponse)
async def chat(request: MessageRequest):
    """
    사용자 메시지에 대한 AI 응답을 생성합니다.
    """
    try:
        logger.info(f"Received message: {request.message}")
        
        # OpenAI API 호출
        response = await openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant for WIGTN, a voice AI service. Be concise and helpful."
                },
                {
                    "role": "user",
                    "content": request.message
                }
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        ai_response = response.choices[0].message.content
        
        # Supabase에 메시지 저장 (선택사항)
        if request.conversation_id:
            try:
                supabase.table("messages").insert({
                    "conversation_id": request.conversation_id,
                    "user_message": request.message,
                    "ai_response": ai_response
                }).execute()
            except Exception as db_error:
                logger.warning(f"Failed to save message to database: {db_error}")
        
        return MessageResponse(
            response=ai_response,
            conversation_id=request.conversation_id or "new"
        )
    
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# 전사(Transcription) 엔드포인트
@app.post("/api/transcribe")
async def transcribe(request: MessageRequest):
    """
    오디오를 텍스트로 변환합니다 (Whisper API 사용)
    """
    try:
        # 실제 구현에서는 오디오 파일을 받아서 처리
        logger.info("Transcription request received")
        
        return {
            "transcription": request.message,
            "status": "success"
        }
    
    except Exception as e:
        logger.error(f"Error in transcribe endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# 시스템 정보 엔드포인트
@app.get("/api/info")
async def info():
    """시스템 정보 조회"""
    return {
        "service": "WIGTN AI Service",
        "version": "1.0.0",
        "models": {
            "chat": "gpt-4",
            "transcription": "whisper-1"
        },
        "region": "asia-southeast1"
    }

# 에러 핸들러
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {str(exc)}")
    return {
        "error": "Internal server error",
        "detail": str(exc)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )
