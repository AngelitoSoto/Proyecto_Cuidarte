const { getAuditLogs } = require('../services/auditService');

/**
 * Consultar eventos de auditoría (RF-5.1)
 * Rol requerido: Admin (RB-2)
 */
async function listAuditLogs(req, res) {
  try {
    const logs = await getAuditLogs();
    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  listAuditLogs
};
