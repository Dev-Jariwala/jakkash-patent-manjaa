import { Input } from "./input";
import { cn } from "../../lib/utils";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-toastify";
import { Trash2 } from "lucide-react";
import { buttonVariants } from "./button";

const FileUploaderContext = createContext(null);

export const useFileUpload = () => {
  const context = useContext(FileUploaderContext);
  if (!context) {
    throw new Error("useFileUpload must be used within a FileUploaderProvider");
  }
  return context;
};

export const FileUploader = forwardRef(
  (
    {
      className,
      dropzoneOptions,
      value,
      onValueChange,
      reSelect,
      orientation = "vertical",
      children,
      dir,
      ...props
    },
    ref
  ) => {
    const [isFileTooBig, setIsFileTooBig] = useState(false);
    const [isLOF, setIsLOF] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const {
      accept = {
        "image/*": [".jpg", ".jpeg", ".png", ".gif"],
      },
      maxFiles = 1,
      maxSize = 4 * 1024 * 1024,
      multiple = true,
    } = dropzoneOptions;

    const reSelectAll = maxFiles === 1 ? true : reSelect;
    const direction = dir === "rtl" ? "rtl" : "ltr";

    const removeFileFromSet = useCallback(
      (i) => {
        if (!value) return;
        const newFiles = value.filter((_, index) => index !== i);
        onValueChange(newFiles);
      },
      [value, onValueChange]
    );

    const onDrop = useCallback(
      (acceptedFiles, rejectedFiles) => {
        const files = acceptedFiles;

        if (!files) {
          toast.error("file error , probably too big");
          return;
        }

        const newValues = value ? [...value] : [];

        if (reSelectAll) {
          newValues.splice(0, newValues.length);
        }

        files.forEach((file) => {
          if (newValues.length < maxFiles) {
            newValues.push(file);
          }
        });

        onValueChange(newValues);

        if (rejectedFiles.length > 0) {
          for (let i = 0; i < rejectedFiles.length; i++) {
            if (rejectedFiles[i].errors[0]?.code === "file-too-large") {
              toast.error(
                `File is too large. Max size is ${maxSize / 1024 / 1024}MB`
              );
              break;
            }
            if (rejectedFiles[i].errors[0]?.message) {
              toast.error(rejectedFiles[i].errors[0].message);
              break;
            }
          }
        }
      },
      [reSelectAll, value, maxFiles, maxSize, onValueChange]
    );

    useEffect(() => {
      if (!value) return;
      if (value.length === maxFiles) {
        setIsLOF(true);
        return;
      }
      setIsLOF(false);
    }, [value, maxFiles]);

    const opts = dropzoneOptions
      ? dropzoneOptions
      : { accept, maxFiles, maxSize, multiple };

    const dropzoneState = useDropzone({
      ...opts,
      onDrop,
      onDropRejected: () => setIsFileTooBig(true),
      onDropAccepted: () => setIsFileTooBig(false),
    });

    const handleKeyDown = useCallback(
      (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!value) return;

        const moveNext = () => {
          const nextIndex = activeIndex + 1;
          setActiveIndex(nextIndex > value.length - 1 ? 0 : nextIndex);
        };

        const movePrev = () => {
          const nextIndex = activeIndex - 1;
          setActiveIndex(nextIndex < 0 ? value.length - 1 : nextIndex);
        };

        const prevKey =
          orientation === "horizontal"
            ? direction === "ltr"
              ? "ArrowLeft"
              : "ArrowRight"
            : "ArrowUp";

        const nextKey =
          orientation === "horizontal"
            ? direction === "ltr"
              ? "ArrowRight"
              : "ArrowLeft"
            : "ArrowDown";

        if (e.key === nextKey) {
          moveNext();
        } else if (e.key === prevKey) {
          movePrev();
        } else if (e.key === "Enter" || e.key === "Space") {
          if (activeIndex === -1) {
            dropzoneState.inputRef.current?.click();
          }
        } else if (e.key === "Delete" || e.key === "Backspace") {
          if (activeIndex !== -1) {
            removeFileFromSet(activeIndex);
            if (value.length - 1 === 0) {
              setActiveIndex(-1);
              return;
            }
            movePrev();
          }
        } else if (e.key === "Escape") {
          setActiveIndex(-1);
        }
      },
      [
        value,
        activeIndex,
        removeFileFromSet,
        orientation,
        direction,
        dropzoneState,
      ]
    );

    return (
      <FileUploaderContext.Provider
        value={{
          dropzoneState,
          isLOF,
          isFileTooBig,
          removeFileFromSet,
          activeIndex,
          setActiveIndex,
          orientation,
          direction,
        }}
      >
        <div
          ref={ref}
          tabIndex={0}
          onKeyDownCapture={handleKeyDown}
          className={cn(
            "tw-grid tw-w-full focus:tw-outline-none tw-overflow-hidden ",
            className,
            {
              "tw-gap-2": value && value.length > 0,
            }
          )}
          dir={dir}
          {...props}
        >
          {children}
        </div>
      </FileUploaderContext.Provider>
    );
  }
);

FileUploader.displayName = "FileUploader";

export const FileUploaderContent = forwardRef(
  ({ children, className, ...props }, ref) => {
    const { orientation } = useFileUpload();
    const containerRef = useRef(null);

    return (
      <div
        className={cn("tw-w-full tw-px-1")}
        ref={containerRef}
        aria-description="content file holder"
      >
        <div
          {...props}
          ref={ref}
          className={cn(
            "tw-flex tw-rounded-xl tw-gap-1",
            orientation === "horizontal"
              ? "tw-flex-row tw-flex-wrap"
              : "tw-flex-col",
            className
          )}
        >
          {children}
        </div>
      </div>
    );
  }
);

FileUploaderContent.displayName = "FileUploaderContent";

export const FileUploaderItem = forwardRef(
  ({ className, deleteButtonClassname, index, children, ...props }, ref) => {
    const { removeFileFromSet, activeIndex, direction } = useFileUpload();
    const isSelected = index === activeIndex;
    return (
      <div
        ref={ref}
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "tw-h-6 tw-p-1 tw-justify-between tw-cursor-pointer tw-relative",
          className,
          isSelected ? "bg-muted" : ""
        )}
        {...props}
      >
        <div className="tw-font-medium tw-leading-none tw-tracking-tight tw-flex tw-items-center tw-justify-center tw-gap-1.5 h-full tw-w-full">
          {children}
        </div>
        <button
          type="button"
          className={cn(
            "tw-absolute",
            deleteButtonClassname,
            direction === "rtl" ? "tw-top-1 tw-left-1" : "tw-top-1 tw-right-1"
          )}
          onClick={() => removeFileFromSet(index)}
        >
          <span className="tw-sr-only">remove item {index}</span>
          <Trash2
            size={14}
            className="hover:tw-stroke-destructive tw-duration-200 tw-ease-in-out"
          />
        </button>
      </div>
    );
  }
);

FileUploaderItem.displayName = "FileUploaderItem";

export const FileInput = forwardRef(
  ({ className, children, ...props }, ref) => {
    const { dropzoneState, isFileTooBig, isLOF } = useFileUpload();
    const rootProps = isLOF ? {} : dropzoneState.getRootProps();
    return (
      <div
        ref={ref}
        {...props}
        className={`tw-relative tw-w-full ${
          isLOF ? "tw-opacity-50 tw-cursor-not-allowed " : "tw-cursor-pointer "
        }`}
      >
        <div
          className={cn(
            `tw-w-full tw-rounded-lg tw-duration-300 tw-ease-in-out
         ${
           dropzoneState.isDragAccept
             ? "tw-border-green-500"
             : dropzoneState.isDragReject || isFileTooBig
             ? "tw-border-red-500"
             : "tw-border-gray-300"
         }`,
            className
          )}
          {...rootProps}
        >
          {children}
        </div>
        <Input
          ref={dropzoneState.inputRef}
          disabled={isLOF}
          {...dropzoneState.getInputProps()}
          className={`${isLOF ? "tw-cursor-not-allowed" : ""}`}
        />
      </div>
    );
  }
);

FileInput.displayName = "FileInput";
