export const QUERY_KEYS = {
  user:           ["user"],
  wallet:         ["wallet"],
  walletStats: ["walletStats"],
  walletLogs:     ["wallet-logs"],
  transactions:   ["transactions"],
  transaction:    (id) => ["transactions", id],
  receipt:        (id) => ["receipt", id],
  notifications:  ["notifications"],
  adminStats:     ["admin-stats"],
  adminUsers:     (params) => ["admin-users", params],
  fraudReports:   (params) => ["fraud-reports", params],
  fraudReport:    (id) => ["fraud-reports", id],
};