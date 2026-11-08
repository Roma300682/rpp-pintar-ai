import React from 'react';
import { BookOpen, CheckCircle2, HeartHandshake, Smile, Eye, ArrowRight } from 'lucide-react';

interface GuideModalProps {
  onStartGenerator: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ onStartGenerator }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-3 border border-emerald-200">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Panduan Resmi Guru Indonesia</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Format Rencana Pembelajaran Mendalam
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-600">
          Mengacu pada prinsip Kurikulum Merdeka dan pendekatan Pembelajaran Mendalam (Deep Learning) yang berkesadaran, bermakna, dan menggembirakan.
        </p>
      </div>

      {/* 3 Core Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Eye className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm mb-1">1. Berkesadaran (Mindful)</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Murid menyadari sepenuhnya apa tujuan belajarnya, mengapa materi tersebut penting, dan bagaimana proses berpikir mereka berlangsung (metakognisi).
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm mb-1">2. Bermakna (Meaningful)</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Konsep yang dipelajari selalu dikaitkan dengan konteks nyata kehidupan murid di lingkungan sekitarnya serta lintas disiplin ilmu.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Smile className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm mb-1">3. Menggembirakan (Joyful)</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Suasana belajar yang aman, hangat, menantang, serta dilengkapi ice breaking edukatif dan kolaborasi yang aktif.
          </p>
        </div>
      </div>

      {/* 6 Structural Components Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs mb-8">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span>Struktur Baku 6 Komponen RPP / Modul Ajar</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="font-bold text-emerald-800 text-sm mb-1">1. Identitas</div>
            <p className="text-slate-600">
              Nama sekolah, nama & NIP guru, mata pelajaran, fase/kelas/semester, topik pembelajaran, alokasi waktu, dan tahun pelajaran.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="font-bold text-emerald-800 text-sm mb-1">2. Identifikasi</div>
            <p className="text-slate-600">
              Kesiapan belajar murid (paham utuh, berkembang, perlu bantuan), minat & gaya belajar, relevansi kehidupan, serta 8 dimensi profil lulusan.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="font-bold text-emerald-800 text-sm mb-1">3. Desain Pembelajaran</div>
            <p className="text-slate-600">
              Capaian Pembelajaran (CP), lintas disiplin ilmu, Tujuan Pembelajaran (TP), praktik pedagogis (PBL/PjBL), lingkungan & digital.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="font-bold text-emerald-800 text-sm mb-1">4. Pengalaman Belajar</div>
            <p className="text-slate-600">
              Tahap Awal (salam, apersepsi, ice breaking), Inti (memahami, mengaplikasi, merefleksi), dan Penutup lengkap dengan alokasi menit per pertemuan.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="font-bold text-emerald-800 text-sm mb-1">5. Asesmen Pembelajaran</div>
            <p className="text-slate-600">
              Asesmen diagnostik awal, formatif proses, dan sumatif akhir dilengkapi matriks rubrik 4 level: Sangat Baik, Baik, Cukup, Perlu Bimbingan.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="font-bold text-emerald-800 text-sm mb-1">6. Lampiran & Pengesahan</div>
            <p className="text-slate-600">
              LKPD siap pakai, bahan bacaan guru & murid, glosarium, diferensiasi konten/proses/produk, dan kolom pengesahan Kepala Sekolah & Guru.
            </p>
          </div>
        </div>

        {/* Dedicated SMK Callout */}
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-xs text-slate-700">
          <div className="flex items-center gap-2 font-bold text-blue-900 text-sm mb-2">
            <span>🛠️ Penerapan Khusus untuk SMK (Sekolah Menengah Kejuruan)</span>
          </div>
          <p className="leading-relaxed mb-2">
            Aplikasi ini <strong>sangat optimal dan siap digunakan untuk seluruh Program/Konsentrasi Keahlian SMK</strong> di Indonesia:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-800">
            <li><strong>Fase E (Kelas X SMK):</strong> Dasar-dasar Program Keahlian, pengenalan proses bisnis industri, K3LH, dan perkembangan teknologi.</li>
            <li><strong>Fase F (Kelas XI & XII SMK):</strong> Konsentrasi Keahlian spesifik seperti <strong>Akuntansi dan Keuangan Lembaga (AKL)</strong>, TKJ, Otomotif, Kuliner, DKV, serta PKL dan PKK.</li>
            <li><strong>Khusus Akuntansi & Keuangan Lembaga (AKL):</strong> Mendukung modul Akuntansi Keuangan (Rekonsiliasi Bank, Kas Kecil, Piutang, Persediaan), Komputer Akuntansi (Spreadsheet/Software), Praktikum Akuntansi Lembaga/Instansi Pemerintah, dan Administrasi Perpajakan lengkap dengan etika profesi dan ketelitian angka.</li>
            <li><strong>Model Pembelajaran Kejuruan:</strong> Mendukung <em>Teaching Factory (TeFa)</em>, Project-Based Learning (PjBL) berstandar DUDIKA, dan simulasi transaksi riil.</li>
            <li><strong>LKPD Berbentuk Jobsheet / Kertas Kerja:</strong> Dilengkapi langkah SOP kerja akuntansi/industri, format neraca/jurnal, dan rubrik penilaian ketelitian teknis.</li>
          </ul>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-200 flex justify-center">
          <button
            onClick={onStartGenerator}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors"
          >
            <span>Mulai Susun RPP dengan AI</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
