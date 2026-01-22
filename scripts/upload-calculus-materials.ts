import fs from "fs";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const PDFParser = require("pdf-parse");

interface ChapterInfo {
  filename: string;
  sourceBook: string;
  chapter: string;
  section: string;
  startPage: number;
}

const CALCULUS_MATERIALS: ChapterInfo[] = [
  // Study Guides
  {
    filename: "mitres_18_001_f17_guide_ch14_1769095294279.pdf",
    sourceBook: "Strang's Calculus (MIT OCW)",
    chapter: "14",
    section: "Double Integrals",
    startPage: 526,
  },
  {
    filename: "mitres_18_001_f17_guide_ch15_1769095294291.pdf",
    sourceBook: "Strang's Calculus (MIT OCW)",
    chapter: "15",
    section: "Vector Calculus",
    startPage: 554,
  },
  // Solution Manuals
  {
    filename: "mitres_18_001_f17_manual_ch05_1769095294291.pdf",
    sourceBook: "Strang's Calculus Solutions (MIT OCW)",
    chapter: "5",
    section: "Integrals",
    startPage: 181,
  },
  {
    filename: "mitres_18_001_f17_manual_ch06_1769095294292.pdf",
    sourceBook: "Strang's Calculus Solutions (MIT OCW)",
    chapter: "6",
    section: "Exponentials and Logarithms",
    startPage: 234,
  },
  {
    filename: "mitres_18_001_f17_manual_ch07_1769095294292.pdf",
    sourceBook: "Strang's Calculus Solutions (MIT OCW)",
    chapter: "7",
    section: "Techniques of Integration",
    startPage: 287,
  },
  {
    filename: "mitres_18_001_f17_manual_ch08_1769095294292.pdf",
    sourceBook: "Strang's Calculus Solutions (MIT OCW)",
    chapter: "8",
    section: "Applications of the Integral",
    startPage: 318,
  },
  {
    filename: "mitres_18_001_f17_manual_ch09_1769095294292.pdf",
    sourceBook: "Strang's Calculus Solutions (MIT OCW)",
    chapter: "9",
    section: "Polar Coordinates and Complex Numbers",
    startPage: 350,
  },
  {
    filename: "mitres_18_001_f17_manual_ch10_1769095294292.pdf",
    sourceBook: "Strang's Calculus Solutions (MIT OCW)",
    chapter: "10",
    section: "Infinite Series",
    startPage: 373,
  },
  {
    filename: "mitres_18_001_f17_manual_ch11_1769095294292.pdf",
    sourceBook: "Strang's Calculus Solutions (MIT OCW)",
    chapter: "11",
    section: "Vectors and Matrices",
    startPage: 405,
  },
  {
    filename: "mitres_18_001_f17_manual_ch12_1769095294293.pdf",
    sourceBook: "Strang's Calculus Solutions (MIT OCW)",
    chapter: "12",
    section: "Motion Along a Curve",
    startPage: 452,
  },
  {
    filename: "mitres_18_001_f17_manual_ch13_1769095294293.pdf",
    sourceBook: "Strang's Calculus Solutions (MIT OCW)",
    chapter: "13",
    section: "Partial Derivatives",
    startPage: 475,
  },
  {
    filename: "mitres_18_001_f17_manual_ch14_1769095294293.pdf",
    sourceBook: "Strang's Calculus Solutions (MIT OCW)",
    chapter: "14",
    section: "Multiple Integrals",
    startPage: 526,
  },
  {
    filename: "mitres_18_001_f17_manual_ch15_1769095294293.pdf",
    sourceBook: "Strang's Calculus Solutions (MIT OCW)",
    chapter: "15",
    section: "Vector Calculus",
    startPage: 554,
  },
  {
    filename: "mitres_18_001_f17_manual_ch16_1769095294293.pdf",
    sourceBook: "Strang's Calculus Solutions (MIT OCW)",
    chapter: "16",
    section: "Mathematics after Calculus (Linear Algebra)",
    startPage: 602,
  },
];

async function extractPDFText(filePath: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const uint8Array = new Uint8Array(buffer);
  
  try {
    const pdfParser = new PDFParser(uint8Array);
    const result = pdfParser.getText();
    return result.text || "";
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
    return "";
  }
}

async function uploadToKnowledgeBase(
  content: string,
  info: ChapterInfo
): Promise<{ success: boolean; chunksCreated: number }> {
  const response = await fetch("http://localhost:5000/api/knowledge/bulk-upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: "connect.sid=" + process.env.SESSION_COOKIE,
    },
    body: JSON.stringify({
      content,
      sourceBook: info.sourceBook,
      chapter: info.chapter,
      section: info.section,
      startPage: info.startPage,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upload failed: ${error}`);
  }

  return response.json();
}

async function main() {
  console.log("=== MIT OCW Calculus Materials Uploader ===\n");
  
  let totalChunks = 0;
  let successCount = 0;
  let failCount = 0;

  for (const material of CALCULUS_MATERIALS) {
    const filePath = path.join("attached_assets", material.filename);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${material.filename}`);
      failCount++;
      continue;
    }

    console.log(`📄 Processing: ${material.chapter}. ${material.section}`);
    
    try {
      const content = await extractPDFText(filePath);
      
      if (content.length < 100) {
        console.log(`   ⚠️  Insufficient content extracted (${content.length} chars)`);
        failCount++;
        continue;
      }

      console.log(`   📝 Extracted ${content.length} characters`);
      
      const result = await uploadToKnowledgeBase(content, material);
      
      if (result.success) {
        console.log(`   ✅ Created ${result.chunksCreated} chunks`);
        totalChunks += result.chunksCreated;
        successCount++;
      } else {
        console.log(`   ❌ Upload failed`);
        failCount++;
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
      failCount++;
    }
    
    console.log("");
  }

  console.log("=== Summary ===");
  console.log(`✅ Successful uploads: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📚 Total chunks created: ${totalChunks}`);
}

main().catch(console.error);
