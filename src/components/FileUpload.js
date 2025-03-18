import React, { useState } from "react";
import { postData } from "../services/apiService";
import { endPoint } from "../services/endPoint";
import "../styles/FileUpload.css";

const FileUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await postData(
        endPoint.fileUpload + "/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      // ✅ Check if onUploadSuccess exists before calling it
      if (onUploadSuccess && typeof onUploadSuccess === "function") {
        onUploadSuccess(response.data);
      } else {
        console.error("onUploadSuccess is not a function");
      }

      setFile(null);
      setPreview("");
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  return (
    <div className="file-upload-container">
      <input type="file" accept="image/*,video/*" onChange={handleFileChange} />

      <div className="file-preview">
        {file?.type.startsWith("video") ? (
          <video src={preview} width="100" controls />
        ) : (
          <img src={preview} width="100" alt="Preview" />
        )}
        <button
          className="add-file-button"
          onClick={handleUpload}
          disabled={!file}
        >
          +
        </button>
      </div>
    </div>
  );
};

export default FileUpload;
