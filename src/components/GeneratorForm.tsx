import React, { useState } from 'react';
import {
  Sparkles,
  Upload,
  BookOpen,
  Sliders,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  CheckCircle2,
  Clock,
  GraduationCap,
  RotateCcw,
  AlertTriangle,
  X,
  Layers,
  Compass,
} from 'lucide-react';
import { PRESET_MATERI, PresetMateri } from '../data/presets';
import { UserSchoolProfile } from '../types/rpp';

interface GeneratorFormProps {
  onGenerate: (payload: {
    materi: string;
    settings: any;
  }) => Promise<void>;
  isLoading: boolean;
  profile: UserSchoolProfile;
}

// Popular quick-pick subjects
const QUICK_SUBJECTS = {
  umum: [
    'Bahasa Indonesia',
    'Matematika',
    'Bahasa Inggris',
    'Informatika',
    'PJOK (Olahraga)',
    'Pendidikan Agama & Budi Pekerti',
    'Sejarah',
    'Seni Budaya',
    'Biologi / IPA',
    'Fisika',
    'Kimia',
    'Ekonomi',
    'Geografi',
    'Sosiologi',
  ],
  vokasi: [
    'Akuntansi Keuangan (AKL)',
    'Praktikum Akuntansi Lembaga',
    'Komputer Akuntansi (Spreadsheet/MYOB)',
    'Teknik Jaringan Komputer & Telekomunikasi (TKJ)',
    'Teknik Kendaraan Ringan Otomotif (TKRO)',
    'Desain Komunikasi Visual (DKV)',
    'Kuliner / Tata Boga',
    'Manajemen Perkantoran & Layanan Bisnis (MPLB)',
    'Teknik Pemesinan & Fabrikasi',
    'Farmasi Klinis & Komunitas',
  ],
};

const QUICK_FASES = [
  { label: 'SMK • Kelas X (Fase E)', value: 'Fase E / Kelas X SMK / Semester Ganjil' },
  { label: 'SMK • Kelas XI (Fase F)', value: 'Fase F / Kelas XI SMK / Semester Ganjil' },
  { label: 'SMK • Kelas XII (Fase F)', value: 'Fase F / Kelas XII SMK / Semester Ganjil' },
  { label: 'SMA • Kelas X (Fase E)', value: 'Fase E / Kelas X SMA / Semester Ganjil' },
  { label: 'SMA • Kelas XI (Fase F)', value: 'Fase F / Kelas XI SMA / Semester Ganjil' },
  { label: 'SMA • Kelas XII (Fase F)', value: 'Fase F / Kelas XII SMA / Semester Ganjil' },
];

export const GeneratorForm: React.FC<GeneratorFormProps> = ({
  onGenerate,
  isLoading,
  profile,
}) => {
  const [materi, setMateri] = useState<string>(PRESET_MATERI[0].materi);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESET_MATERI[0].id);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [filterJenjang, setFilterJenjang] = useState<'ALL' | 'AKL' | 'UMUM' | 'SMK' | 'SMA'>('ALL');
  const [formError, setFormError] = useState<{ message: string; isRateLimit?: boolean } | null>(null);

  // Core customizable settings (freely editable for ANY subject)
  const [mataPelajaran, setMataPelajaran] = useState<string>(PRESET_MATERI[0].mapel);
  const [faseKelas, setFaseKelas] = useState<string>('Fase F / Kelas XI SMK / Semester Ganjil');
  const [topikPembelajaran, setTopikPembelajaran] = useState<string>('Rekonsiliasi Bank & Penyesuaian Saldo Kas Perusahaan');
  const [alokasiWaktu, setAlokasiWaktu] = useState<string>('2 Pertemuan x 3 JP (135 Menit)');
  const [praktikPedagogis, setPraktikPedagogis] = useState<string>('Problem Based Learning (PBL)');
  const [tahunPelajaran, setTahunPelajaran] = useState<string>(profile.tahunPelajaranDefault || '2026/2027');

  const [loadingStep, setLoadingStep] = useState<number>(0);

  const filteredPresets = filterJenjang === 'ALL'
    ? PRESET_MATERI
    : filterJenjang === 'AKL'
    ? PRESET_MATERI.filter((p) => p.id.includes('akl') || p.mapel.toLowerCase().includes('akuntansi'))
    : filterJenjang === 'UMUM'
    ? PRESET_MATERI.filter((p) => p.id.startsWith('umum-') || p.mapel.includes('Umum'))
    : filterJenjang === 'SMK'
    ? PRESET_MATERI.filter((p) => p.jenjang === 'SMK' && !p.id.startsWith('umum-'))
    : PRESET_MATERI.filter((p) => p.jenjang === 'SMA');

  const applyPreset = (preset: PresetMateri) => {
    setSelectedPresetId(preset.id);
    setMateri(preset.materi);
    setMataPelajaran(preset.mapel);
    setTopikPembelajaran(preset.judul.replace(/^[^:]+:\s*/, ''));
    setFaseKelas(`${preset.fase} / ${preset.kelas} / Semester Ganjil`);
    setAlokasiWaktu(preset.alokasi);
    setPraktikPedagogis(preset.pedagogi);
    setFormError(null);
  };

  const handleSelectQuickSubject = (subj: string) => {
    setMataPelajaran(subj);
    setSelectedPresetId('');
    // Auto-adjust default alokasi & fase if switching between SMK and Umum
    const isVokasi = QUICK_SUBJECTS.vokasi.includes(subj);
    if (isVokasi && !faseKelas.includes('SMK')) {
      setFaseKelas('Fase F / Kelas XI SMK / Semester Ganjil');
      setAlokasiWaktu('2 Pertemuan x 3 JP (135 Menit)');
    } else if (!isVokasi && faseKelas.includes('SMK')) {
      setFaseKelas('Fase E / Kelas X SMA / Semester Ganjil');
      setAlokasiWaktu('2 Pertemuan x 2 JP (90 Menit)');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setMateri(text);
        setSelectedPresetId('');
        setFormError(null);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault?.();
    if (!materi.trim()) return;

    setFormError(null);
    setLoadingStep(1);
    const t1 = setTimeout(() => setLoadingStep(2), 1800);
    const t2 = setTimeout(() => setLoadingStep(3), 3600);
    const t3 = setTimeout(() => setLoadingStep(4), 5800);

    try {
      await onGenerate({
        materi,
        settings: {
          namaSekolah: profile.namaSekolah,
          namaGuru: profile.namaGuru,
          nipGuru: profile.nipGuru,
          namaKepalaSekolah: profile.namaKepalaSekolah,
          nipKepalaSekolah: profile.nipKepalaSekolah,
          kota: profile.kota,
          mataPelajaran,
          faseKelasSemester: faseKelas,
          topikPembelajaran,
          alokasiWaktu,
          praktikPedagogis,
          tahunPelajaran,
        },
      });
    } catch (err: any) {
      const msg = err?.message || 'Gagal memproses materi dengan AI.';
      const lower = msg.toLowerCase();
      const isQuota =
        lower.includes('429') ||
        lower.includes('resource_exhausted') ||
        lower.includes('quota') ||
        lower.includes('rate-limit') ||
        lower.includes('batas kuota') ||
        lower.includes('token');
      setFormError({
        message: isQuota
          ? 'Batas frekuensi atau kuota token API Gemini sedang padat. Tenang, Anda dapat langsung mengklik "Coba Lagi Sekarang" atau menyusun dengan Engine Kurikulum Merdeka Terintegrasi.'
          : msg,
        isRateLimit: isQuota,
      });
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setLoadingStep(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero Title */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-3 border border-emerald-200 shadow-2xs">
          <GraduationCap className="w-4 h-4 text-emerald-600" />
          <span>Format Resmi Rencana Pembelajaran Mendalam (Kurikulum Merdeka)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Susun RPP Otomatis untuk{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
            Semua Mata Pelajaran Bebas
          </span>
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
          Tentukan mata pelajaran apa saja yang Anda ampu—baik Mapel Umum (SMA/SMK) maupun Vokasi Kejuruan. Tempelkan bahan ajar Anda, AI akan merancang pembelajaran yang berkesadaran, bermakna, dan menggembirakan lengkap dengan LKPD dan rubrik penilaian.
        </p>
      </div>

      {/* Quota / Rate Limit Alert Banner if error occurred */}
      {formError && (
        <div className="mb-6 p-4 rounded-2xl border border-rose-200 bg-rose-50/90 text-rose-950 shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <h4 className="font-bold text-rose-900 text-sm mb-1">
                {formError.isRateLimit ? 'Kuota Request API Gemini Sedang Padat (429)' : 'Terjadi Kendala Penyusunan'}
              </h4>
              <p className="leading-relaxed text-rose-800">{formError.message}</p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="px-3.5 py-1.5 rounded-lg font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Coba Lagi Sekarang</span>
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFormError(null)}
              className="text-rose-400 hover:text-rose-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Preset Chips */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Pilih Contoh Materi Siap Pakai:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {(['ALL', 'AKL', 'UMUM', 'SMK', 'SMA'] as const).map((jenjang) => (
              <button
                key={jenjang}
                type="button"
                onClick={() => setFilterJenjang(jenjang)}
                className={`text-[11px] px-3 py-1 rounded-full font-bold transition-colors ${
                  filterJenjang === jenjang
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {jenjang === 'ALL'
                  ? 'Semua Materi'
                  : jenjang === 'AKL'
                  ? '📊 AKL (Akuntansi)'
                  : jenjang === 'UMUM'
                  ? '📚 Mapel Umum'
                  : jenjang === 'SMK'
                  ? '🛠️ SMK Kejuruan'
                  : '🎓 SMA'}
              </button>
            ))}

            {selectedPresetId && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPresetId('');
                  setMateri('');
                }}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 ml-1"
              >
                <RotateCcw className="w-3 h-3" /> Bersihkan
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {filteredPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                selectedPresetId === preset.id
                  ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-medium shadow-2xs ring-1 ring-emerald-500'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`font-bold truncate text-[11px] ${
                  preset.jenjang === 'SMK' ? 'text-blue-700' : 'text-emerald-700'
                }`}>
                  {preset.jenjang} • {preset.mapel.split('(')[0].trim()}
                </span>
                <span className="text-[10px] text-slate-400">{preset.fase}</span>
              </div>
              <div className="font-semibold text-slate-900 line-clamp-1">
                {preset.judul}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 space-y-6">
          {/* Section 1: Bebas Menentukan Mata Pelajaran */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50/60 via-slate-50 to-teal-50/40 border border-emerald-200/80 space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-600" />
                <span>Mata Pelajaran yang Disusun (Bebas / Ketik Sendiri)</span>
                <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-200">
                Mendukung Semua Mapel
              </span>
            </div>

            {/* Custom Mapel Text Input */}
            <input
              type="text"
              value={mataPelajaran}
              onChange={(e) => {
                setMataPelajaran(e.target.value);
                setSelectedPresetId('');
              }}
              required
              placeholder="Ketik mata pelajaran Anda di sini (misal: Bahasa Indonesia, Matematika, Akuntansi Keuangan, PJOK, DKV, dll)..."
              className="w-full px-3.5 py-2.5 text-sm font-semibold text-slate-900 bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs"
            />

            {/* Quick Pick Subject Chips */}
            <div className="space-y-2 pt-1">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  📚 Pilih Cepat Mapel Umum (SMA / SMK):
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {QUICK_SUBJECTS.umum.map((subj) => (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => handleSelectQuickSubject(subj)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                        mataPelajaran === subj
                          ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                          : 'bg-white hover:bg-emerald-50 text-slate-700 border border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 pt-1">
                  🛠️ Pilih Cepat Kejuruan Vokasi (SMK):
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {QUICK_SUBJECTS.vokasi.map((subj) => (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => handleSelectQuickSubject(subj)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                        mataPelajaran === subj
                          ? 'bg-blue-600 text-white font-bold shadow-2xs'
                          : 'bg-white hover:bg-blue-50 text-slate-700 border border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Fase / Kelas Quick Select */}
            <div className="pt-2 border-t border-emerald-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Jenjang & Fase Kurikulum Merdeka:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {QUICK_FASES.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFaseKelas(f.value)}
                    className={`text-left text-xs px-2.5 py-1.5 rounded-lg transition-all ${
                      faseKelas === f.value
                        ? 'bg-slate-800 text-white font-bold shadow-2xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Main Textarea Materi Bahan Ajar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Materi atau Bahan Ajar</span>
                <span className="text-red-500">*</span>
              </label>

              <label className="cursor-pointer text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors border border-emerald-200">
                <Upload className="w-3.5 h-3.5" />
                <span>Unggah File (.txt)</span>
                <input
                  type="file"
                  accept=".txt,.md,.doc"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <textarea
              value={materi}
              onChange={(e) => {
                setMateri(e.target.value);
                if (selectedPresetId) setSelectedPresetId('');
              }}
              rows={8}
              required
              placeholder="Ketik atau tempelkan (paste) ringkasan materi bahan ajar di sini. Contoh: Rangkuman bab sistem organ tubuh, teks laporan hasil observasi, rekonsiliasi kas bank, hukum newton, algoritma pemrograman python, administrasi perpajakan, dll..."
              className="w-full p-4 text-sm text-slate-800 placeholder-slate-400 bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono leading-relaxed"
            />

            <div className="flex items-center justify-between mt-1 text-xs text-slate-400">
              <span>{materi.length} karakter • Semakin lengkap bahan ajar, semakin mendalam dan presisi RPP yang dihasilkan</span>
              {materi.length > 50 && (
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Materi siap diproses
                </span>
              )}
            </div>
          </div>

          {/* Collapsible Fine Tuning Settings */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/70 text-left flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Penyesuaian Tambahan (Opsional)
                </span>
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  — Topik Spesifik, Alokasi Waktu, Model Pembelajaran & Tahun Pelajaran
                </span>
              </div>
              <div className="text-slate-400">
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showAdvanced && (
              <div className="p-4 sm:p-5 bg-white space-y-4 border-t border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Topik Pembelajaran Spesifik
                    </label>
                    <input
                      type="text"
                      value={topikPembelajaran}
                      onChange={(e) => setTopikPembelajaran(e.target.value)}
                      placeholder="Judul topik spesifik materi"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Alokasi Waktu
                    </label>
                    <input
                      type="text"
                      value={alokasiWaktu}
                      onChange={(e) => setAlokasiWaktu(e.target.value)}
                      placeholder="contoh: 2 Pertemuan x 3 JP (135 Menit)"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Praktik Pedagogis / Model Pembelajaran
                    </label>
                    <select
                      value={praktikPedagogis}
                      onChange={(e) => setPraktikPedagogis(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="Problem Based Learning (PBL)">Problem Based Learning (PBL)</option>
                      <option value="Project Based Learning (PjBL)">Project Based Learning (PjBL)</option>
                      <option value="Teaching Factory (TeFa - Standar Industri / DUDIKA)">Teaching Factory (TeFa - Standar Industri / DUDIKA)</option>
                      <option value="Praktik Bengkel / Studio & Simulasi SOP K3LH">Praktik Bengkel / Studio & Simulasi SOP K3LH</option>
                      <option value="Inkuiri Terbimbing (Guided Inquiry)">Inkuiri Terbimbing (Guided Inquiry)</option>
                      <option value="Discovery Learning">Discovery Learning</option>
                      <option value="Genre-Based Approach (Pendekatan Berbasis Genre)">Genre-Based Approach (Pendekatan Berbasis Genre)</option>
                      <option value="Pembelajaran Berdiferensiasi & Kolaboratif">Pembelajaran Berdiferensiasi & Kolaboratif</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tahun Pelajaran
                    </label>
                    <input
                      type="text"
                      value={tahunPelajaran}
                      onChange={(e) => setTahunPelajaran(e.target.value)}
                      placeholder="contoh: 2026/2027"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button Bar */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              Sekolah: <strong>{profile.namaSekolah || 'Sekolah Indonesia'}</strong> • Guru:{' '}
              <strong>{profile.namaGuru || 'Guru Pengampu'}</strong>
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading || !materi.trim()}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm text-white shadow-md flex items-center justify-center gap-2 transition-all ${
              isLoading || !materi.trim()
                ? 'bg-slate-400 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25 active:scale-[0.98]'
            }`}
          >
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            <span>{isLoading ? 'Sedang Menyusun RPP...' : '✨ Susun RPP Mendalam Otomatis (AI)'}</span>
          </button>
        </div>
      </form>

      {/* Stepped Loading Animation */}
      {isLoading && (
        <div className="mt-8 bg-white border border-emerald-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 animate-spin">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Menyusun RPP Mendalam (Deep Learning Kurikulum Merdeka)...
              </h3>
              <p className="text-xs text-slate-500">
                AI sedang merancang pembelajaran untuk mata pelajaran <strong>{mataPelajaran}</strong> yang berkesadaran, bermakna, dan menggembirakan.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">Menganalisis konsep esensial & jenis pengetahuan dari materi bahan ajar</span>
            </div>
            <div
              className={`flex items-center gap-2 transition-opacity duration-300 ${
                loadingStep >= 2 ? 'text-slate-700 opacity-100' : 'text-slate-400 opacity-60'
              }`}
            >
              {loadingStep >= 2 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span>Merumuskan Capaian Pembelajaran (CP) dan Tujuan Pembelajaran (TP) spesifik</span>
            </div>
            <div
              className={`flex items-center gap-2 transition-opacity duration-300 ${
                loadingStep >= 3 ? 'text-slate-700 opacity-100' : 'text-slate-400 opacity-60'
              }`}
            >
              {loadingStep >= 3 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span>Merancang tahapan belajar berkesadaran: Memahami, Mengaplikasi, Merefleksi</span>
            </div>
            <div
              className={`flex items-center gap-2 transition-opacity duration-300 ${
                loadingStep >= 4 ? 'text-slate-700 opacity-100' : 'text-slate-400 opacity-60'
              }`}
            >
              {loadingStep >= 4 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span>Menyusun LKPD aplikatif, rubrik 4 kategori, dan rencana diferensiasi</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
