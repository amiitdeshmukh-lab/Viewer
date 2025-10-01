import * as THREE from "three";

// ✅ Get bounding boxes for all fragments separately
export function getAllFragmentsBoundingBoxes(viewer: any) {
  const fragList = viewer.model.getFragmentList();
  const fragBox = new THREE.Box3();
  const boxes: THREE.Box3[] = [];

  for (let i = 0; i < fragList.getCount(); i++) {
    fragList.getWorldBounds(i, fragBox);
    boxes.push(fragBox.clone()); // clone is important
  }

  return boxes;
}
