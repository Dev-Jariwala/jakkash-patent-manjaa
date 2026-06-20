/* eslint-disable react/prop-types */

const MutationError = ({ mutation }) => {
  const { error } = mutation;

  if (!error) return null;

  const errorMessage = error.message || "An unexpected error occurred";

  return (
    <div
      className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded"
      role="alert"
    >
      <strong className="font-bold">Error: </strong>
      <span className="block sm:inline">{errorMessage}</span>
    </div>
  );
};

export default MutationError;
