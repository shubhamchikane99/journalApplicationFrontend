// featureService.js
export function hasFeature(featureCode) {
  try {
    const raw = localStorage.getItem("features");
    if (!raw) return false;
    const features = JSON.parse(raw);
    return features[featureCode] === true;
  } catch {
    return false;
  }
}
