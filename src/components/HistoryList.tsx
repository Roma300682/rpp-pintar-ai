import React from 'react';
import {
  FileText,
  Calendar,
  Trash2,
  ExternalLink,
  Download,
  BookOpen,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';
import { RppDocument } from '../types/rpp';
import { exportRppToWord } from '../utils/exportWord';

interface HistoryListProps {
  documents: RppDocument[];
  onSelectDoc: (doc: RppDocument) => void;
  onDeleteDoc: (id: string) => void;
  onNewDoc: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  documents,
  onSelectDoc,
  onDeleteDoc,
  onNewDoc,
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Riwayat RPP Tersimpan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Daftar Modul Ajar dan Rencana Pembelajaran yang telah Anda susun di browser ini.
          </p>
        </div>

        <button
          onClick={onNewDoc}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Susun RPP Baru</span>
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-800 text-base mb-1">Belum Ada RPP Tersimpan</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6">
            Mulai susun rencana pembelajaran pertama Anda dengan memasukkan materi atau bahan ajar pada tab generator.
          </p>
          <button
            onClick={onNewDoc}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all"
          >
            Mulai Susun Sekarang
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 p-4 sm:p-5 transition-all shadow-xs hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {doc.identitas.mataPelajaran || 'Mata Pelajaran'}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {doc.identitas.faseKelasSemester}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(doc.updatedAt || doc.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {doc.identitas.topikPembelajaran || 'Rencana Pembelajaran'}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-1">
                  Sekolah: {doc.identitas.namaSatuanPendidikan} • Guru: {doc.identitas.namaGuru} • {doc.identitas.alokasiWaktu}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0">
                <button
                  onClick={() => exportRppToWord(doc)}
                  className="p-2 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg text-xs flex items-center gap-1 border border-slate-200"
                  title="Unduh Word (.doc)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Word</span>
                </button>

                <button
                  onClick={() => onDeleteDoc(doc.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200"
                  title="Hapus dari riwayat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onSelectDoc(doc)}
                  className="flex items-center gap-1 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors"
                >
                  <span>Buka RPP</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
