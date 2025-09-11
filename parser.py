import pandas as pd
import io
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware # To handle requests from the frontend

app = FastAPI()

# Allow requests from your frontend (important for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Or specify your frontend's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    # 1. Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV.")

    try:
        # 2. Read file contents into memory
        contents = await file.read()
        buffer = io.BytesIO(contents)

        # 3. Parse with Pandas
        df = pd.read_csv(buffer)
        buffer.close()

        # 4. Perform initial processing
        num_rows, num_cols = df.shape
        columns = df.columns.tolist()
        preview = df.head().to_dict(orient='records') # Convert first 5 rows to JSON

        # 5. Send back a success response
        return {
            "filename": file.filename,
            "rows": num_rows,
            "columns": num_cols,
            "column_names": columns,
            "preview": preview,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {e}")