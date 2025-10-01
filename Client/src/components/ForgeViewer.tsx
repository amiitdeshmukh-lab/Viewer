import React, { useEffect, useRef, useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Box,
  CircularProgress,
  IconButton,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import ViewInArIcon from "@mui/icons-material/ViewInAr";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import { getAllFragmentsBoundingBoxes } from "./BoundingBoxUtils";

declare const Autodesk: any;

const colorOptions: { name: string; hex: number }[] = [
  { name: "Green", hex: 0x00ff00 },
  { name: "Red", hex: 0xff0000 },
];

const ForgeViewer: React.FC<any> = ({ urn, getAccessToken }) => {
  const viewerDiv = useRef<HTMLDivElement>(null);
  const viewerInstance = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"light-theme" | "dark-theme">("light-theme");
  const [bboxVisible, setBboxVisible] = useState(false);
  const [bboxColor, setBboxColor] = useState<number>(0x00ff00);

  useEffect(() => {
    if (!viewerDiv.current) return;

    Autodesk.Viewing.Initializer({ env: "AutodeskProduction", getAccessToken }, () => {
      const viewer = new Autodesk.Viewing.GuiViewer3D(viewerDiv.current!, {
        extensions: ["Autodesk.DocumentBrowser"],
      });
      viewer.start();
      viewer.setTheme(theme);
      viewerInstance.current = viewer;

      if (urn) {
        Autodesk.Viewing.Document.load(
          `urn:${urn}`,
          (doc: any) => {
            const defaultModel = doc.getRoot().getDefaultGeometry();
            viewer.loadDocumentNode(doc, defaultModel, {});
            setLoading(false);
          },
          (code: any, message: any) => {
            console.error("Failed to load document", message);
            setLoading(false);
          }
        );
      }
    });

    return () => {
      if (viewerInstance.current && viewerInstance.current.finish) {
        viewerInstance.current.finish();
        viewerInstance.current = null;
      }
    };
  }, [urn, getAccessToken, theme]);

  const toggleTheme = () => {
    const newTheme = theme === "light-theme" ? "dark-theme" : "light-theme";
    setTheme(newTheme);
    viewerInstance.current?.setTheme(newTheme);
  };

  const toggleBoundingBox = () => {
    if (!viewerInstance.current) return;

    if (bboxVisible) {
      viewerInstance.current.overlays.clearScene("bboxOverlay");
      viewerInstance.current.impl.invalidate(true, true, true);
      setBboxVisible(false);
    } else {
      const boxes = getAllFragmentsBoundingBoxes(viewerInstance.current);
      boxes.forEach((bbox) => {
        drawBoundingBoxWithCenter(viewerInstance.current, bbox, bboxColor);
      });
      setBboxVisible(true);
    }
  };

  const handleColorChange = (event: any) => {
    const color = event.target.value;
    setBboxColor(color);
    if (bboxVisible && viewerInstance.current) {
      const boxes = getAllFragmentsBoundingBoxes(viewerInstance.current);
      viewerInstance.current.overlays.clearScene("bboxOverlay");
      boxes.forEach((bbox) => drawBoundingBoxWithCenter(viewerInstance.current, bbox, color));
    }
  };

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 5, overflow: "hidden" }}>
      <CardHeader
        title="Forge 3D Viewer"
        action={
          <Box display="flex" alignItems="center" gap={1}>
            <FormControl size="small">
              <InputLabel>Box Color</InputLabel>
              <Select value={bboxColor} label="Box Color" onChange={handleColorChange}>
                {colorOptions.map((c) => (
                  <MenuItem key={c.hex} value={c.hex}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Tooltip title="Toggle Bounding Box">
              <IconButton color="primary" onClick={toggleBoundingBox}>
                <ViewInArIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Switch Theme">
              <IconButton color="secondary" onClick={toggleTheme}>
                <Brightness4Icon />
              </IconButton>
            </Tooltip>
          </Box>
        }
        sx={{ background: "#f9fafc" }}
      />
      <CardContent sx={{ p: 0, height: "600px", position: "relative" }}>
        {loading && (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            sx={{ position: "absolute", inset: 0, zIndex: 10, bgcolor: "rgba(255,255,255,0.8)" }}
          >
            <CircularProgress />
          </Box>
        )}
        <div ref={viewerDiv} id="forgeViewer" style={{ width: "100%", height: "100%" }} />
      </CardContent>
    </Card>
  );
};

export default ForgeViewer;

// ==========================
// Draw Bounding Box + Center Lines with color
// ==========================
function drawBoundingBoxWithCenter(viewer: any, bbox: any, color: number = 0x00ff00) {
  const THREE = (window as any).THREE;
  if (!THREE) return;

  if (!viewer.overlays.hasScene("bboxOverlay")) viewer.overlays.addScene("bboxOverlay");

  const min = bbox.min;
  const max = bbox.max;

  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    min.x, min.y, min.z, max.x, min.y, min.z,
    max.x, min.y, min.z, max.x, max.y, min.z,
    max.x, max.y, min.z, min.x, max.y, min.z,
    min.x, max.y, min.z, min.x, min.y, min.z,

    min.x, min.y, max.z, max.x, min.y, max.z,
    max.x, min.y, max.z, max.x, max.y, max.z,
    max.x, max.y, max.z, min.x, max.y, max.z,
    min.x, max.y, max.z, min.x, min.y, max.z,

    min.x, min.y, min.z, min.x, min.y, max.z,
    max.x, min.y, min.z, max.x, min.y, max.z,
    max.x, max.y, min.z, max.x, max.y, max.z,
    min.x, max.y, min.z, min.x, max.y, max.z,
  ]);
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

  const boxMaterial = new THREE.LineBasicMaterial({ color });
  const boxLines = new THREE.LineSegments(geometry, boxMaterial);
  viewer.overlays.addMesh(boxLines, "bboxOverlay");

  const center = new THREE.Vector3();
  bbox.getCenter(center);

  const sphereGeom = new THREE.SphereGeometry((max.x - min.x) * 0.01);
  const sphereMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const sphere = new THREE.Mesh(sphereGeom, sphereMat);
  sphere.position.copy(center);
  viewer.overlays.addMesh(sphere, "bboxOverlay");

  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
  const createLine = (p1: any, p2: any) => new THREE.Line(new THREE.BufferGeometry().setFromPoints([p1, p2]), lineMaterial);

  const lineX = createLine(new THREE.Vector3(min.x, center.y, center.z), new THREE.Vector3(max.x, center.y, center.z));
  const lineY = createLine(new THREE.Vector3(center.x, min.y, center.z), new THREE.Vector3(center.x, max.y, center.z));
  const lineZ = createLine(new THREE.Vector3(center.x, center.y, min.z), new THREE.Vector3(center.x, center.y, max.z));

  viewer.overlays.addMesh(lineX, "bboxOverlay");
  viewer.overlays.addMesh(lineY, "bboxOverlay");
  viewer.overlays.addMesh(lineZ, "bboxOverlay");

  viewer.impl.invalidate(true, true, true);
}
