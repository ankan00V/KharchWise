import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import useSWR from 'swr';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../api';

export const ImportTab = () => {
  const { group, id: groupId } = useOutletContext<any>();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [importReport, setImportReport] = useState<any>(null);

  const { data: anomalies = [], mutate: fetchAnomalies } = useSWR<any[]>(groupId ? `/api/groups/${groupId}/anomalies` : null, api);

  // Anomaly Resolution State
  const [selectedPayerIds, setSelectedPayerIds] = useState<Record<number, string>>({});

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await api(`/api/groups/${groupId}/import`, {
        method: 'POST',
        body: formData,
        isFormData: true
      });

      setImportReport(data.report);
      await fetchAnomalies();
    } catch (err: any) {
      console.error(err);
      alert('Upload failed: ' + err.message);
    } finally {
      setLoading(false);
      setFile(null);
    }
  };

  const resolveAnomaly = async (anomalyId: number, action: string, assignedPayerId?: string) => {
    try {
      await api(`/api/groups/${groupId}/anomalies/${anomalyId}/resolve`, {
        method: 'POST',
        body: { action, paid_by_id: assignedPayerId }
      });
      fetchAnomalies();
    } catch (err) {
      console.error(err);
    }
  };

  const pendingAnomalies = anomalies.filter(a => a.status === 'PENDING_APPROVAL');
  const resolvedAnomalies = anomalies.filter(a => a.status === 'AUTO_RESOLVED' || a.status === 'RESOLVED');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-[48px]">
      <Card padding="lg" variant="glass" className="border border-[rgba(255,255,255,0.1)]">
        <h2 className="text-[32px] font-sans font-bold text-white tracking-tight mb-6">Import Expenses CSV</h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <input 
            type="file" 
            accept=".csv"
            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            className="block w-full text-[16px] font-sans text-[rgba(255,255,255,0.7)] file:mr-4 file:py-3 file:px-6 file:rounded-[12px] file:border-0 file:text-[16px] file:font-bold file:bg-[#121214] file:text-white hover:file:bg-[rgba(255,255,255,0.1)] cursor-pointer transition-colors border border-[rgba(255,255,255,0.2)] rounded-[12px] p-2 bg-[rgba(255,255,255,0.02)]"
          />
          <Button onClick={handleUpload} disabled={!file || loading} variant="primary" className="shrink-0 h-[58px]">
            {loading ? 'Uploading...' : 'Upload Data'}
          </Button>
        </div>
      </Card>

      {importReport && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card padding="lg" variant="solid" className="border border-[#3CE370]/30 shadow-[0_4px_30px_rgba(60,227,112,0.15)]">
            <h2 className="text-[32px] font-sans font-bold text-white tracking-tight mb-4">Import Complete</h2>
            <div className="bg-[#3CE370]/10 text-[#3CE370] p-6 rounded-[16px] mb-4 font-sans font-semibold text-[18px] border border-[#3CE370]/20">
              Processed {importReport.totalRowsProcessed} rows, found {importReport.anomalies.length} anomalies.
            </div>
          </Card>
        </motion.div>
      )}

      {anomalies.length > 0 && (
        <Card padding="lg" variant="glass">
          <h2 className="text-[32px] font-sans font-bold text-white tracking-tight mb-4">Anomaly Report</h2>
          <p className="text-[18px] font-sans font-medium text-[rgba(255,255,255,0.7)] mb-8">
            Found {anomalies.length} total anomalies. <span className="text-[#FF4A00] font-bold">{pendingAnomalies.length} require your approval.</span>
          </p>

          {pendingAnomalies.length > 0 && (
            <div className="mb-[48px]">
              <h3 className="text-[24px] font-sans font-bold text-white tracking-tight mb-6">Pending Approvals</h3>
              <div className="space-y-6">
                {pendingAnomalies.map(a => (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={a.id} className="p-6 border border-[#FF4A00]/30 bg-[#FF4A00]/5 rounded-[24px]">
                    <p className="font-sans font-bold text-[18px] text-white">Row {a.csv_row_number}: <span className="text-[#FF4A00]">{a.anomaly_type}</span></p>
                    <p className="text-[16px] font-sans text-[rgba(255,255,255,0.8)] mt-2 mb-6">{a.description}</p>
                    <div className="flex flex-wrap gap-4 items-center">
                      {(a.anomaly_type === 'EXACT_DUPLICATE' || a.anomaly_type === 'CONFLICTING_DUPLICATE') && (
                        <>
                          <Button variant="danger" onClick={() => resolveAnomaly(a.id, 'CONFIRM_DUPLICATE')}>
                            Confirm Duplicate
                          </Button>
                          <Button variant="outline" onClick={() => resolveAnomaly(a.id, 'KEEP_BOTH')}>
                            Keep Both
                          </Button>
                        </>
                      )}
                      
                      {a.anomaly_type === 'MEMBERSHIP_MISMATCH' && (
                        <>
                          <Button variant="primary" onClick={() => resolveAnomaly(a.id, 'INCLUDE_ANYWAY')}>
                            Include Anyway
                          </Button>
                          <Button variant="outline" onClick={() => resolveAnomaly(a.id, 'EXCLUDE')}>
                            Exclude
                          </Button>
                        </>
                      )}
                      
                      {a.anomaly_type === 'MISSING_PAYER' && (
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                          <select 
                            value={selectedPayerIds[a.id] || ''}
                            onChange={(e) => setSelectedPayerIds({ ...selectedPayerIds, [a.id]: e.target.value })}
                            className="w-full sm:flex-1 border border-[rgba(255,255,255,0.2)] rounded-[12px] p-3 font-sans text-[16px] focus:outline-none focus:border-[#3CE370] bg-[#121214] text-white"
                          >
                            <option value="">Select payer...</option>
                            {group.memberships.map((m: any) => (
                              <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                            ))}
                          </select>
                          <Button 
                            variant="primary" 
                            className="w-full sm:w-auto shrink-0"
                            onClick={() => {
                              const selectedPayer = selectedPayerIds[a.id];
                              if (selectedPayer) {
                                resolveAnomaly(a.id, 'ASSIGN_PAYER', selectedPayer);
                              } else {
                                alert("Please select a payer first.");
                              }
                            }}
                          >
                            Assign Payer
                          </Button>
                        </div>
                      )}
                      
                      {!['EXACT_DUPLICATE', 'CONFLICTING_DUPLICATE', 'MEMBERSHIP_MISMATCH', 'MISSING_PAYER'].includes(a.anomaly_type) && (
                        <Button variant="outline" onClick={() => resolveAnomaly(a.id, 'ACKNOWLEDGE')}>
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {resolvedAnomalies.length > 0 && (
            <div>
              <h3 className="text-[24px] font-sans font-bold text-white tracking-tight mb-6">Resolved Actions Log</h3>
              <div className="space-y-[16px]">
                {resolvedAnomalies.map(a => (
                  <div key={a.id} className="p-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-[16px] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                      <span className="font-sans font-bold text-[18px] text-white">Row {a.csv_row_number} - {a.anomaly_type}</span>
                      <p className="text-[14px] font-sans text-[rgba(255,255,255,0.5)] mt-1">{a.description}</p>
                    </div>
                    <div className="sm:text-right shrink-0">
                      <span className="text-[12px] font-sans font-bold text-[#3CE370] uppercase tracking-[1px] px-3 py-1 bg-[#3CE370]/10 rounded-full border border-[#3CE370]/20">{a.action_taken || a.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </motion.div>
  );
};
