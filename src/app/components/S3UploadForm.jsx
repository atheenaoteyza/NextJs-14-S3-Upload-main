"use client";
import { useState, useEffect } from "react";

const UploadForm = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState([]);

  // Fetch uploaded images
  useEffect(() => {
    fetchUploadedImages();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/s3-upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      const imageUrl = `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_S3_REGION}.amazonaws.com/${data.fileName}`;
      setImageUrls((prev) => [imageUrl, ...prev]);
      setUploading(false);
      alert("Upload successful!");
    } catch (error) {
      console.log(error);
      setUploading(false);
    }
  };

  const fetchUploadedImages = async () => {
    try {
      const response = await fetch("/api/s3-upload");
      if (response.ok) {
        const data = await response.json();
        setImageUrls(data.imageUrls);
      } else {
        throw new Error("Failed to fetch images");
      }
    } catch (error) {
      console.error("Error fetching images", error);
    }
  };

  return (
    <>
      <h1>Upload Files to S3 Bucket</h1>

      <form onSubmit={handleSubmit}>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button type="submit" disabled={!file || uploading}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </form>
      <h2>Uploaded Images</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {imageUrls.map((url, index) => (
          <img
            key={index}
            src={url}
            alt={`Uploaded ${index}`}
            style={{ width: "200px", height: "200px", borderRadius: "8px" }}
          />
        ))}
      </div>
    </>
  );
};

export default UploadForm;
