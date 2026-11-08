import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { synthesizeRppFromMaterial, synthesizeRefinedContent, normalizeRppDocument } from './src/utils/synthesizer.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '20mb' }));

// Middleware to allow iframe embedding on any website & CORS
app.use((req: Request, res: Response, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  // Explicitly remove X-Frame-Options to allow embedding across school sites/WordPress/Google Sites
  res.removeHeader('X-Frame-Options');
  res.setHeader('Content-Security-Policy', 'frame-ancestors *');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Check if valid GEMINI_API_KEY is available
function hasGeminiApiKey(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(
    key &&
    key !== 'MY_GEMINI_API_KEY' &&
    key.trim().length > 5
  );
}

function getGeminiClient(): GoogleGenAI | null {
  if (!hasGeminiApiKey()) return null;
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isApiTransientOrQuotaError(err: any): boolean {
  if (!err) return false;
  const status = err.status || err.code || err.statusCode;
  const message = ((err.message || '') + JSON.stringify(err)).toLowerCase();
  return (
    status === 429 ||
    status === 503 ||
    status === 500 ||
    status === 504 ||
    status === 403 ||
    status === 'RESOURCE_EXHAUSTED' ||
    status === 'UNAVAILABLE' ||
    status === 'PERMISSION_DENIED' ||
    message.includes('429') ||
    message.includes('503') ||
    message.includes('403') ||
    message.includes('resource_exhausted') ||
    message.includes('unavailable') ||
    message.includes('permission_denied') ||
    message.includes('access_token') ||
    message.includes('token') ||
    message.includes('quota') ||
    message.includes('rate-limit') ||
    message.includes('high demand') ||
    message.includes('overloaded') ||
    message.includes('fetch failed') ||
    message.includes('timeout')
  );
}

// Robust JSON parser to prevent 'Unexpected token' syntax errors from cut-off or formatted AI output
function safeParseJson(rawText: string): any | null {
  if (!rawText || typeof rawText !== 'string') return null;

  // 1. Strip markdown fences
  const cleaned = rawText
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im, '')
    .replace(/```\s*$/m, '')
    .trim();

  // Try direct parse
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    // Continue to repair attempts
  }

  // 2. Extract largest outer JSON object { ... }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = cleaned.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch (_) {
      // Continue to bracket repair
    }
  }

  // 3. Attempt repair for truncated tokens (common when token limit is hit)
  if (firstBrace !== -1) {
    let candidate = cleaned.slice(firstBrace);
    // Remove trailing incomplete commas or keys
    candidate = candidate.replace(/,\s*$/, '').replace(/,\s*"[^"]*":?\s*$/, '');

    // Balance quotes
    const quoteMatches = candidate.match(/(?<!\\)"/g) || [];
    if (quoteMatches.length % 2 !== 0) {
      candidate += '"';
    }

    // Balance brackets and braces
    const openBrackets = (candidate.match(/\[/g) || []).length;
    const closeBrackets = (candidate.match(/\]/g) || []).length;
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      candidate += ']';
    }

    const openBraces = (candidate.match(/\{/g) || []).length;
    const closeBraces = (candidate.match(/\}/g) || []).length;
    for (let i = 0; i < openBraces - closeBraces; i++) {
      candidate += '}';
    }

    try {
      return JSON.parse(candidate);
    } catch (_) {
      // Return null on failure
    }
  }

  return null;
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', hasApiKey: hasGeminiApiKey(), time: new Date().toISOString() });
});

// Generator endpoint supporting ANY subject freely across SMK & SMA without search grounding overhead
app.post('/api/generate-rpp', async (req: Request, res: Response) => {
  try {
    const { materi, settings } = req.body;

    if (!materi || typeof materi !== 'string' || materi.trim().length === 0) {
      return res.status(400).json({ error: 'Materi atau bahan ajar wajib diisi.' });
    }

    const promptText = `
Anda adalah konsultan ahli Kurikulum Merdeka Kemendikbudristek RI dan perancang Pembelajaran Mendalam (Deep Learning) yang berkesadaran, bermakna, dan menggembirakan di Indonesia.
Anda dapat menyusun RPP / Modul Ajar untuk SEMUA MATA PELAJARAN secara BEBAS, baik:
1. Mata Pelajaran Umum (Bahasa Indonesia, Matematika, Bahasa Inggris, PJOK/Olahraga, Informatika, Seni Budaya, Sejarah, Pendidikan Agama & Budi Pekerti, PPKn, Fisika, Kimia, Biologi, Ekonomi, Sosiologi, Geografi, dll).
2. Mata Pelajaran Kejuruan SMK (Akuntansi Keuangan / AKL, Rekayasa Perangkat Lunak / RPL, Teknik Jaringan Komputer / TKJ, Otomotif / Kendaraan Ringan, Teknik Mesin, Perhotelan, Kuliner / Tata Boga, Tata Busana, Desain Komunikasi Visual / DKV, Farmasi, Keperawatan, Manajemen Perkantoran / MPLB, Bisnis Digital, dll).
3. Muatan Lokal dan Mata Pelajaran Pilihan Bebas Lainnya.

Susunlah Rencana Pembelajaran Mendalam (RPP / Modul Ajar) LENGKAP, SIAP CETAK, dan BERMUTU TINGGI berdasarkan MATERI / BAHAN AJAR berikut:

--- MATERI / BAHAN AJAR INPUT DARI GURU ---
${materi.trim()}
-------------------------------------------

Informasi Tambahan / Preferensi Guru (Gunakan jika relevan, atau lengkapi secara profesional jika kosong):
- Nama Satuan Pendidikan: ${settings?.namaSekolah || 'Sekolah Indonesia'}
- Nama Guru: ${settings?.namaGuru || 'Guru Pengampu, S.Pd.'}
- NIP Guru: ${settings?.nipGuru || '19850101 201001 1 001'}
- Nama Kepala Sekolah: ${settings?.namaKepalaSekolah || 'Kepala Sekolah, M.Pd.'}
- NIP Kepala Sekolah: ${settings?.nipKepalaSekolah || '19750505 200003 1 002'}
- Mata Pelajaran / Konsentrasi Keahlian: ${settings?.mataPelajaran || 'Auto-detect dari materi'}
- Fase / Kelas / Semester: ${settings?.faseKelasSemester || 'Fase E (Kelas X) atau Fase F (Kelas XI/XII)'}
- Topik Pembelajaran: ${settings?.topikPembelajaran || 'Auto-detect dari materi'}
- Alokasi Waktu: ${settings?.alokasiWaktu || '2 Pertemuan x 2 JP atau 3-4 JP untuk praktik'}
- Tahun Pelajaran: ${settings?.tahunPelajaran || '2026/2027'}
- Praktik Pedagogis Utama: ${settings?.praktikPedagogis || 'Problem Based Learning / Project Based Learning / Inkuiri'}
- Kota/Kabupaten Pengesahan: ${settings?.kota || 'Surabaya'}

PEDOMAN PENYUSUNAN PEDAGOGIS:
- Jika materi bersifat kejuruan / SMK: Terapkan pendekatan Teaching Factory (TeFa), Project Based Learning (PjBL) berorientasi DUDIKA, integrasi K3LH dan budaya kerja 5R (Ringkas, Rapi, Resik, Rawat, Rajin), serta format LKPD sebagai Jobsheet Praktik Industri nyata.
- Jika materi bersifat mata pelajaran umum / SMA: Terapkan pendekatan inkuiri kontekstual, pemecahan masalah nyata dalam kehidupan murid, dan analisis penalaran kritis.

Format yang dihasilkan WAJIB mengikuti struktur standar 6 komponen:
1. Identitas (Nama satuan pendidikan, Nama guru, Mata pelajaran/Konsentrasi Keahlian, Fase/kelas/semester, Topik pembelajaran, Alokasi waktu, Tahun pelajaran)
2. Identifikasi (Kesiapan belajar murid [sudah paham, sedang berkembang, perlu bantuan], Minat & gaya belajar [visual, auditori, kinestetik], Latar belakang & kebutuhan khusus, Jenis pengetahuan materi [faktual, konseptual, prosedural, metakognitif], Relevansi materi dengan kehidupan nyata / dunia kerja di Indonesia, Dimensi Profil Lulusan yang ditargetkan dengan centang boolean dan penjelasan operasional)
3. Desain Pembelajaran (Capaian Pembelajaran/CP resmi elemen terkait, Lintas disiplin ilmu, Tujuan Pembelajaran kompetensi+konten, Topik pembelajaran kontekstual, Praktik pedagogis, Kemitraan pembelajaran, Lingkungan pembelajaran, Pemanfaatan digital)
4. Pengalaman Belajar (Rincian per pertemuan lengkap dengan alokasi waktu menit. Tahap awal: salam/doa/presensi, apersepsi & pertanyaan pemantik yang merangsang rasa ingin tahu, penyampaian tujuan dan ice breaking yang seru dan edukatif. Tahap inti: Memahami, Mengaplikasi [praktik/proyek], Merefleksi. Tahap penutup: kesimpulan & refleksi, umpan balik/info pertemuan berikutnya/doa)
5. Asesmen Pembelajaran (Asesmen awal diagnostik, Asesmen proses formatif, Asesmen akhir sumatif / unjuk kerja, serta Rubrik Penilaian 4 Kategori: Sangat Baik [4], Baik [3], Cukup [2], Perlu Bimbingan [1] untuk indikator TP dan Dimensi Profil Lulusan)
6. Lampiran (Lembar Kerja Peserta Didik / Jobsheet riil berisi langkah aktivitas/praktik dan soal-soal relevan; Bahan bacaan ringkas guru & murid serta glosarium istilah teknis; Instrumen refleksi murid & guru; Rencana pembelajaran diferensiasi konten, proses, produk; Pengesahan resmi)

HASILKAN DALAM FORMAT JSON MURNI yang valid dan terstruktur tanpa pembuka/penutup basa-basi.`;

    const systemInstruction = `Anda adalah asisten kecerdasan buatan spesialis penyusunan RPP dan Modul Ajar Kurikulum Merdeka Kemendikbudristek RI untuk seluruh mata pelajaran. Anda selalu merespons dengan JSON yang valid, terstruktur rapi, mendalam, dan kaya konten pendidikan berkualitas tinggi dalam Bahasa Indonesia.`;

    // If no valid Gemini API key configured, seamlessly activate Kurikulum Merdeka engine
    const ai = getGeminiClient();
    if (!ai) {
      console.info('[RPP Generator] No external API key detected. Using built-in Kurikulum Merdeka synthesizer.');
      const synthesizedData = synthesizeRppFromMaterial(materi, settings);
      return res.json({
        success: true,
        isFallbackMode: true,
        notice: 'RPP berhasil disusun menggunakan Engine Kurikulum Merdeka Terintegrasi.',
        data: synthesizedData,
      });
    }

    // Truncate overly massive input if teacher pasted an entire book (preserves token limits)
    const sanitizedMateri = materi.length > 12000 ? materi.substring(0, 12000) + '\n\n[Materi diringkas untuk mengoptimalkan kuota token AI]' : materi;

    // Multi-tier execution prioritizing ultra-fast gemini-3.1-flash-lite (2-5s response) followed by gemini-3.8-flash
    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];

    let lastError: any = null;
    let response: any = null;

    for (let i = 0; i < modelsToTry.length; i++) {
      const modelName = modelsToTry[i];
      try {
        const isFlash38 = modelName === 'gemini-3.8-flash';
        const config: any = {
          systemInstruction,
          responseMimeType: 'application/json',
        };
        // Low thinking level prevents token quota exhaustion and reduces latency dramatically
        if (isFlash38) {
          config.thinkingConfig = {
            thinkingLevel: ThinkingLevel.LOW,
          };
        }

        const generatePromise = ai.models.generateContent({
          model: modelName,
          contents: promptText,
          config,
        });

        // 45s timeout to ensure deep learning generation is never prematurely cut off
        const timeoutMs = isFlash38 ? 45000 : 30000;
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout after ${timeoutMs / 1000}s on ${modelName}`)), timeoutMs)
        );
        response = await Promise.race([generatePromise, timeoutPromise]);
        break; // Success!
      } catch (err: any) {
        lastError = err;
        console.info(`[Gemini Engine] Model ${modelName} transitioned to next tier.`);

        if (isApiTransientOrQuotaError(err) && i < modelsToTry.length - 1) {
          await sleep(400);
          continue;
        }
        break;
      }
    }

    if (!response || !response.text) {
      console.info('[Gemini Engine] Activating Kurikulum Merdeka synthesis fallback.');
      const fallbackData = synthesizeRppFromMaterial(materi, settings);
      return res.json({
        success: true,
        isFallbackMode: true,
        notice: 'RPP berhasil disusun menggunakan Engine Kurikulum Merdeka Berkelanjutan.',
        data: fallbackData,
      });
    }

    const textOutput = response.text;
    const parsedData = safeParseJson(textOutput);

    if (!parsedData) {
      console.warn('[Gemini API] Could not parse AI JSON output. Applying Kurikulum Merdeka synthesis fallback...');
      const fallbackData = synthesizeRppFromMaterial(materi, settings);
      return res.json({
        success: true,
        isFallbackMode: true,
        notice: 'RPP berhasil disusun menggunakan Engine Kurikulum Merdeka Berkelanjutan.',
        data: fallbackData,
      });
    }

    const finalData = normalizeRppDocument(parsedData, materi, settings);

    res.json({
      success: true,
      data: finalData,
    });
  } catch (error: any) {
    console.warn('Handling RPP generation fallback after error:', error?.message || error);
    try {
      const fallbackData = synthesizeRppFromMaterial(req.body?.materi || '', req.body?.settings);
      res.json({
        success: true,
        isFallbackMode: true,
        notice: 'RPP berhasil disusun menggunakan Engine Kurikulum Merdeka Berkelanjutan.',
        data: fallbackData,
      });
    } catch (innerErr: any) {
      res.status(500).json({
        success: false,
        error: 'Terjadi kendala saat menyusun RPP: ' + (innerErr?.message || 'Format tidak valid'),
      });
    }
  }
});

// Refine section endpoint with fallback
app.post('/api/refine-section', async (req: Request, res: Response) => {
  try {
    const { sectionName, currentContent, userInstruction, contextInfo } = req.body;

    if (!sectionName || !userInstruction) {
      return res.status(400).json({ error: 'Section dan instruksi perbaikan wajib diisi.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        success: true,
        isFallbackMode: true,
        data: {
          updatedContent: synthesizeRefinedContent(sectionName, currentContent, userInstruction),
          summaryChanges: `Diselaraskan sesuai arahan: "${userInstruction}"`,
        },
      });
    }

    const promptText = `
Anda adalah pakar kurikulum Merdeka. Perbaiki atau kembangkan bagian berikut dari Rencana Pembelajaran Mendalam (RPP) sesuai instruksi guru:

Bagian yang diperbaiki: "${sectionName}"
Konteks Mata Pelajaran & Topik: "${contextInfo?.mataPelajaran || ''} - ${contextInfo?.topik || ''}"
Konten Saat Ini:
${typeof currentContent === 'object' ? JSON.stringify(currentContent, null, 2) : currentContent}

Instruksi Perbaikan dari Guru:
"${userInstruction}"

Hasilkan konten hasil perbaikan dalam format JSON:
{
  "updatedContent": ... (konten baru yang disempurnakan sesuai tipe aslinya, baik object, array, atau string) ...,
  "summaryChanges": "penjelasan singkat 1 kalimat apa yang telah diubah"
}
`;

    const models = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    let response: any = null;
    let lastError: any = null;

    for (let i = 0; i < models.length; i++) {
      const modelName = models[i];
      try {
        const isFlash38 = modelName === 'gemini-3.8-flash';
        const config: any = {
          responseMimeType: 'application/json',
        };
        if (isFlash38) {
          config.thinkingConfig = {
            thinkingLevel: ThinkingLevel.LOW,
          };
        }

        const generatePromise = ai.models.generateContent({
          model: modelName,
          contents: promptText,
          config,
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout on ${modelName}`)), 20000)
        );
        response = await Promise.race([generatePromise, timeoutPromise]);
        break;
      } catch (err: any) {
        lastError = err;
        if (isApiTransientOrQuotaError(err) && i < models.length - 1) {
          await sleep(300);
          continue;
        }
        break;
      }
    }

    if (!response || !response.text) {
      return res.json({
        success: true,
        isFallbackMode: true,
        data: {
          updatedContent: synthesizeRefinedContent(sectionName, currentContent, userInstruction),
          summaryChanges: `Diselaraskan sesuai arahan: "${userInstruction}"`,
        },
      });
    }

    const parsed = safeParseJson(response.text);
    if (!parsed || !parsed.updatedContent) {
      return res.json({
        success: true,
        isFallbackMode: true,
        data: {
          updatedContent: synthesizeRefinedContent(sectionName, currentContent, userInstruction),
          summaryChanges: `Diselaraskan sesuai arahan: "${userInstruction}"`,
        },
      });
    }

    res.json({
      success: true,
      data: parsed,
    });
  } catch (error: any) {
    console.warn('Handling refine section fallback after error:', error?.message || error);
    res.json({
      success: true,
      isFallbackMode: true,
      data: {
        updatedContent: synthesizeRefinedContent(
          req.body?.sectionName || '',
          req.body?.currentContent,
          req.body?.userInstruction || ''
        ),
        summaryChanges: `Diselaraskan sesuai arahan: "${req.body?.userInstruction || ''}"`,
      },
    });
  }
});

// Global Express error handler to guarantee valid JSON responses
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('[API Server Error]:', err?.message || err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({
    success: false,
    error: err?.message || 'Terjadi kendala pada pemrosesan server.',
  });
});

async function startServer() {
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    (process.env.NODE_ENV !== 'development' &&
      fs.existsSync(path.resolve(__dirname, 'dist', 'index.html')));

  if (isProduction) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `RPP Pintar Server running at http://0.0.0.0:${PORT} [${
        isProduction ? 'PRODUCTION' : 'DEVELOPMENT'
      }]`
    );
  });
}

startServer();

