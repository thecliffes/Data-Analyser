import pandas as pd
import io
import numpy as np 
from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

# To run: py -m uvicorn main:app --reload

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

temp_storage = {}

@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV.")

    try:
        contents = await file.read()
        buffer = io.BytesIO(contents)
        df = pd.read_csv(buffer)
        buffer.close()

        # --- MODIFIED: Store the DataFrame and return a simpler response ---
        temp_storage[file.filename] = df
        
        # The data preview can now be part of the summary call if you wish,
        # but sending it here is also fine for immediate feedback.
        preview = df.head().to_dict(orient='records')

        return {
            "filename": file.filename,
            "status": "File uploaded successfully",
            "preview": preview # It's good to keep the instant preview
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {e}")

# --- NEW: Add the entire summary endpoint below ---
@app.get("/summarize/{filename}")
async def get_summary(filename: str):
    if filename not in temp_storage:
        raise HTTPException(status_code=404, detail="File not found. Please upload again.")

    df = temp_storage[filename]

    # --- 1. Overall Summary ---
    overall_stats = {
        "rows": int(df.shape[0]),
        "columns": int(df.shape[1]),
        "missing_cells": int(df.isnull().sum().sum()),
        "missing_cells_percent": float(round(df.isnull().sum().sum() / (df.shape[0] * df.shape[1]) * 100, 2))
    }

    # --- 2. Column-by-Column Analysis ---
    column_details = []
    for col in range(1, len(df.columns)):
        col_data = df[df.columns[col]]
        
        col_summary = {
            "index": [i for i in range(1, len(col_data.dropna()))],
            "column_name": df.columns[col],
            "data_type": str(col_data.dtype),
            "missing_values": int(col_data.isnull().sum())
        }
        
        if pd.api.types.is_numeric_dtype(col_data):
            col_summary["type"] = "numeric"
            stats = col_data.describe().to_dict()
            col_summary["stats"] = {k: round(v, 2) if isinstance(v, float) else v for k, v in stats.items()}
            
            col_summary["values"] = np.array(col_data.dropna()).tolist()
        
        

        elif pd.api.types.is_object_dtype(col_data) :
            col_summary["type"] = "categorical"
            value_counts = col_data.value_counts().nlargest(5).to_dict()
            col_summary["value_counts"] = {str(k): int(v) for k, v in value_counts.items()}

            col_summary["values"] = np.array(col_data).tolist()
        

        print(col_summary)
        column_details.append(col_summary)


    return {"overall_stats": overall_stats, "column_details": column_details}

@app.delete("/delete/{filename}")
async def delete_file(filename: str):
    """
    Deletes a file from the temporary in-memory storage.
    """
    if filename not in temp_storage:
        raise HTTPException(status_code=404, detail="File not found in storage.")

    try:
        # Remove the DataFrame from the dictionary
        del temp_storage[filename]
        return {"status": "File deleted successfully", "filename": filename}
    except Exception as e:
        # This is a fallback, though the 'del' operation is unlikely to fail
        raise HTTPException(status_code=500, detail=f"Error deleting file: {e}")