import React, { useState, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Card,
  CardMedia,
  CardContent,
} from "@mui/material";
import { motion } from "framer-motion";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

interface DragDropUploadProps {
  onUpload: (file: File, entrypoint?: string) => void;
}

const DragDropUpload: React.FC<DragDropUploadProps> = ({ onUpload }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const simulateProgress = () => {
    setUploadProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setUploadProgress(progress);
    }, 200);
  };

  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    setFileSize((file.size / 1024 / 1024).toFixed(2) + " MB");

    if (file.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }

    if (file.name.endsWith(".zip")) {
      const entrypoint = window.prompt(
        "Enter the main design filename inside the archive:"
      );
      if (!entrypoint) return;
      onUpload(file, entrypoint);
    } else {
      onUpload(file);
    }

    simulateProgress();
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = () => {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    handleFileUpload(file);

    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      sx={{
        width: "100%",
        height: "100%",
        p: 2,
        background: "linear-gradient(145deg, #f0f4ff, #ffffff)",
      }}
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{ width: "80%", maxWidth: 600 }}
      >
        <Paper
          elevation={isDragOver ? 8 : 4}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleButtonClick}
          sx={{
            border: isDragOver ? "3px dashed #28a745" : "3px dashed #1976d2",
            borderRadius: 4,
            p: 6,
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.3s ease",
            background: isDragOver
              ? "linear-gradient(135deg, #e8fdf1, #ffffff)"
              : "#fff",
          }}
        >
          <CloudUploadIcon
            sx={{
              fontSize: 70,
              mb: 2,
              color: isDragOver ? "success.main" : "primary.main",
              transform: isDragOver ? "rotate(15deg) scale(1.2)" : "none",
              transition: "0.3s",
            }}
          />

          <Typography variant="h5" fontWeight="bold" gutterBottom>
            {isDragOver ? "Drop your file here" : "Upload 3D Model"}
          </Typography>
          <Typography color="text.secondary" gutterBottom>
            Drag & drop your model here, or click to browse
          </Typography>

          {preview && (
            <Card
              sx={{
                maxWidth: 200,
                mx: "auto",
                my: 2,
                borderRadius: 3,
                boxShadow: 4,
              }}
            >
              <CardMedia
                component="img"
                height="140"
                image={preview}
                alt="preview"
              />
              <CardContent>
                <Typography variant="body2" fontWeight="bold">
                  {fileName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {fileSize}
                </Typography>
              </CardContent>
            </Card>
          )}

          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={handleButtonClick}
            sx={{ mt: 2, borderRadius: 3, px: 4, py: 1.5 }}
          >
            Choose File
          </Button>

          {uploadProgress > 0 && (
            <Box sx={{ width: "80%", mt: 3, mx: "auto" }}>
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
                color="primary"
                sx={{ borderRadius: 2, height: 10 }}
              />
              <Typography
                variant="body2"
                align="center"
                sx={{ mt: 1, fontWeight: 500 }}
              >
                {Math.round(uploadProgress)}%
              </Typography>
            </Box>
          )}

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 3, fontStyle: "italic" }}
          >
            Supported formats: .dwg, .step, .iges, .sat, .ipt, .iam, .zip
          </Typography>
        </Paper>
      </motion.div>

      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </Box>
  );
};

export default DragDropUpload;
