function setRef(ref, node) {
  if (typeof ref === "function") {
    ref(node);
    return;
  }
  if (ref != null) {
    ref.current = node;
  }
}

export function composeRefs(...refs) {
  return (node) => {
    refs.forEach((ref) => {
      setRef(ref, node);
    });
  };
}