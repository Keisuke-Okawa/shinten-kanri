"use client";

import { useRef, useState } from "react";
import { ClipboardPaste, ImageIcon, Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { type StoreProfile } from "@/lib/schema";
import { analyzeStoreImageAction } from "@/app/workspace/shinten/actions";
import { Button } from "@/components/ui/button";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB = 10;

type Props = {
  /** 解析したデータを呼び出し元に渡す */
  onImport: (patch: Partial<StoreProfile>) => void;
};

/**
 * 画像をアップロードしてGeminiに解析させ、店舗情報を自動入力するフィールド。
 * AddStoreDialog と StoreProfilePane で共有できる設計。
 */
export function ImageImportField({ onImport }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const applyFile = (f: File) => {
    setStatus(null);

    if (!ACCEPTED_TYPES.includes(f.type)) {
      setStatus({
        type: "error",
        message: "JPG・PNG・WebP・GIF の画像ファイルを選択してください。",
      });
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setStatus({
        type: "error",
        message: `ファイルサイズは${MAX_SIZE_MB}MB以下にしてください。`,
      });
      return;
    }

    setFile(f);
    const objectUrl = URL.createObjectURL(f);
    setPreview(objectUrl);
  };

  const handleFileChange = (f: File | null) => {
    if (f) applyFile(f);
  };

  const handlePaste = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((t) => ACCEPTED_TYPES.includes(t));
        if (imageType) {
          const blob = await item.getType(imageType);
          const pastedFile = new File([blob], "clipboard.png", {
            type: imageType,
          });
          applyFile(pastedFile);
          return;
        }
      }
      setStatus({
        type: "error",
        message:
          "クリップボードに画像がありません。先に画像をコピーしてください。",
      });
    } catch {
      setStatus({
        type: "error",
        message:
          "クリップボードへのアクセスが許可されていません。ブラウザの設定を確認してください。",
      });
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setStatus(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setStatus(null);

    try {
      const base64 = await toBase64(file);
      // Canvas で JPEG に変換しているため mimeType は image/jpeg 固定
      const result = await analyzeStoreImageAction(base64, "image/jpeg");
      if (result.ok) {
        onImport(result.data);
        setStatus({
          type: "success",
          message: "読み込みました。取れなかった項目は手入力してください。",
        });
      } else {
        setStatus({ type: "error", message: result.error });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* ファイル選択エリア */}
      {!preview ? (
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-20 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-input bg-transparent text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <ImageIcon className="size-5" />
            <span className="text-xs">
              クリックして画像を選択（JPG / PNG / WebP）
            </span>
          </button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handlePaste()}
            className="w-full"
          >
            <ClipboardPaste className="size-3.5" />
            クリップボードから貼り付け
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {/* サムネイル */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="プレビュー"
            className="size-16 rounded-md object-cover"
          />
          <div className="flex flex-1 flex-col gap-1.5">
            <p className="truncate text-xs text-muted-foreground">
              {file?.name ?? "クリップボード"}
            </p>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleAnalyze()}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    解析中…
                  </>
                ) : (
                  "AIで解析する"
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={loading}
                aria-label="画像をクリア"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ステータスメッセージ */}
      {status && (
        <p
          className={cn("text-xs", {
            "text-muted-foreground": status.type === "success",
            "text-destructive": status.type === "error",
          })}
        >
          {status.message}
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        チラシ・名刺・看板の写真等からAIが店名・住所・電話番号などを読み取ります。
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

/**
 * File → base64文字列（圧縮あり）
 * Canvas で最大 1920px に縮小し、JPEG 品質 0.85 でエンコードする。
 * Server Action の 10MB 上限に余裕を持って収める。
 */
function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const MAX = 1920;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) {
          height = Math.round((height * MAX) / width);
          width = MAX;
        } else {
          width = Math.round((width * MAX) / height);
          height = MAX;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas コンテキストを取得できませんでした"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      const base64 = dataUrl.split(",")[1];
      if (!base64) {
        reject(new Error("base64変換に失敗しました"));
        return;
      }
      resolve(base64);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("画像の読み込みに失敗しました"));
    };

    img.src = objectUrl;
  });
}
