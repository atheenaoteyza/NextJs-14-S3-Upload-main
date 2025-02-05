import { NextResponse } from "next/server";
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import path from "path"; // To handle file extensions

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
  },
});

async function uploadFileToS3(file, fileName) {
  const fileBuffer = file;
  console.log(fileName);

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${fileName}`,
    Body: fileBuffer,
    ContentType: file.type, // Dynamically set content type
  };

  const command = new PutObjectCommand(params);
  await s3Client.send(command);
  return fileName;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const customName = formData.get("imageName"); // Get custom image name from formData

    if (!file) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }
    // Check if file.type is accessible
    if (!file.type || file.type === "") {
      console.warn(
        "Warning: file.type is missing or undefined. Using fallback."
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Get original file extension
    const fileExtension = path.extname(file.name);

    // Use custom name or default to original name, ensuring the extension is included
    const fileName = customName ? `${customName}${fileExtension}` : file.name;

    const uploadedFileName = await uploadFileToS3(buffer, fileName);

    return NextResponse.json({ success: true, fileName: uploadedFileName });
  } catch (error) {
    return NextResponse.json({ error });
  }
}

export async function GET() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
    });

    const response = await s3Client.send(command);
    const imageUrls = response.Contents.map(
      (item) =>
        `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${item.Key}`
    );

    return NextResponse.json({ imageUrls });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}
