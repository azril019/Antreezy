import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 2MB limit" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PNG and JPG are allowed" },
        { status: 400 }
      );
    }

    // Create FormData for catbox
    const catboxFormData = new FormData();
    catboxFormData.append("fileToUpload", file);
    catboxFormData.append("reqtype", "fileupload");

    // Upload directly to catbox.moe
    const response = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: catboxFormData,
    });

    if (!response.ok) {
      throw new Error("Catbox upload failed");
    }

    const imageUrl = await response.text();

    // Validate that we got a valid URL back
    if (!imageUrl || !imageUrl.includes("catbox.moe")) {
      throw new Error("Invalid response from catbox");
    }

    return NextResponse.json({ url: imageUrl.trim() });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
