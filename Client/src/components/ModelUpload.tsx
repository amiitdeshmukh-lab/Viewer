import React, { useRef, useState } from "react";
import { Button, Box, Typography, Tooltip } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";

interface ModelUploadProps {
  onUpload: (file: File, entrypoint?: string) => void;
}

const ModelUpload: React.FC<ModelUploadProps> = ({ onUpload }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<string>("");

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  const onFileChange = () => {
    const file = inputRef.current?.files?.[0];
    if (!file) return;

    setSelectedFile(file.name);

    if (file.name.endsWith(".zip")) {
      const entrypoint = window.prompt(
        "Please enter the filename of the main design inside the archive."
      );
      if (!entrypoint) return;
      onUpload(file, entrypoint);
    } else {
      onUpload(file);
    }

    // Reset input for next upload
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={2}
      sx={{ p: 1, border: "1px dashed #1976d2", borderRadius: 2, bgcolor: "#f5f5f5" }}
    >
      <Tooltip title="Upload your 3D model or ZIP file">
        <Button
          variant="contained"
          color="primary"
          startIcon={<UploadFileIcon />}
          onClick={onButtonClick}
          sx={{
            textTransform: "none",
            fontWeight: 500,
            "&:hover": { bgcolor: "#1565c0" },
          }}
        >
          Upload Model
        </Button>
      </Tooltip>

      {selectedFile && (
        <Typography
          variant="body2"
          sx={{ fontStyle: "italic", color: "#333", maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {selectedFile}
        </Typography>
      )}

      <input
        type="file"
        ref={inputRef}
        onChange={onFileChange}
        style={{ display: "none" }}
      />
    </Box>
  );
};

export default ModelUpload;
