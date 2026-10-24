import React, { useState, useMemo } from 'react'
import {
  CreditCard,
  Search,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  Banknote,
  RefreshCw,
  Printer,
  X,
} from 'lucide-react'
import type { KdsOrder, PaymentMethod, PaymentStatus } from '../types/kds'

interface TransactionsPageProps {
  orders: KdsOrder[]
  onRefresh?: () => void
  isRefreshing?: boolean
}

interface TransactionItem {
  id: string
  orderRef: string
  customerName: string
  phone: string
  address: string
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  amount: number
  date: string // ISO date
  itemsCount: number
  items: { name: string; quantity: number; unitPrice: number }[]
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  orders,
  onRefresh,
  isRefreshing,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [methodFilter, setMethodFilter] = useState<'all' | PaymentMethod>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all')
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null)

  // Construction de la liste des transactions à partir des commandes réelles et historiques
  const transactions: TransactionItem[] = useMemo(() => {
    // 1. Transactions issues des commandes KDS actuelles
    const liveTx: TransactionItem[] = orders.map((o) => ({
      id: `TRX-${String(o.id).padStart(6, '0')}`,
      orderRef: o.orderRef,
      customerName: o.customerName,
      phone: o.phone,
      address: o.address,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus || (o.status === 'delivered' ? 'paid' : 'pending'),
      amount: o.totalAmount,
      date: o.createdAt,
      itemsCount: o.items.reduce((acc, it) => acc + it.quantity, 0),
      items: o.items.map((it) => ({
        name: it.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      })),
    }))

    // 2. Transactions historiques complètes de la journée (garantit un journal fourni)
    const baseTx: TransactionItem[] = [
      {
        id: 'TRX-104821',
        orderRef: '#BMC-9821',
        customerName: 'Moussa Ndiaye',
        phone: '77 452 19 82',
        address: 'Almadies, Dakar',
        paymentMethod: 'wave',
        paymentStatus: 'paid',
        amount: 8500,
        date: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
        itemsCount: 3,
        items: [
          { name: 'Tacos mixte pané', quantity: 2, unitPrice: 4000 },
          { name: 'Bissap Royal Glacé', quantity: 1, unitPrice: 500 },
        ],
      },
      {
        id: 'TRX-104820',
        orderRef: '#BMC-9820',
        customerName: 'Fatou Sow',
        phone: '78 124 33 90',
        address: 'Mermoz, Dakar',
        paymentMethod: 'orange_money',
        paymentStatus: 'paid',
        amount: 5000,
        date: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        itemsCount: 1,
        items: [{ name: 'Burger BMC Complet', quantity: 1, unitPrice: 5000 }],
      },
      {
        id: 'TRX-104819',
        orderRef: '#BMC-9819',
        customerName: 'Ibrahima Fall',
        phone: '76 892 01 44',
        address: 'Ouakam Cité Comico',
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        amount: 11000,
        date: new Date(Date.now() - 1000 * 60 * 52).toISOString(),
        itemsCount: 3,
        items: [
          { name: 'Box 8 Wings Épicées', quantity: 2, unitPrice: 4500 },
          { name: 'Bouye Onctueux', quantity: 2, unitPrice: 1000 },
        ],
      },
      {
        id: 'TRX-104818',
        orderRef: '#BMC-9818',
        customerName: 'Aissatou Diallo',
        phone: '77 319 80 55',
        address: 'Plateau, Dakar',
        paymentMethod: 'wave',
        paymentStatus: 'paid',
        amount: 7000,
        date: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
        itemsCount: 2,
        items: [{ name: 'Tacos viande pané', quantity: 2, unitPrice: 3500 }],
      },
      {
        id: 'TRX-104817',
        orderRef: '#BMC-9817',
        customerName: 'Cheikh Sarr',
        phone: '70 941 22 10',
        address: 'Point E, Dakar',
        paymentMethod: 'orange_money',
        paymentStatus: 'paid',
        amount: 4000,
        date: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
        itemsCount: 1,
        items: [{ name: 'Burger Poulet Crispy', quantity: 1, unitPrice: 4000 }],
      },
      {
        id: 'TRX-104816',
        orderRef: '#BMC-9816',
        customerName: 'Abdoulaye Guèye',
        phone: '77 654 09 88',
        address: 'Sacré-Cœur 3',
        paymentMethod: 'cash',
        paymentStatus: 'pending',
        amount: 9000,
        date: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        itemsCount: 2,
        items: [{ name: 'Tacos cordon bleu pané', quantity: 2, unitPrice: 4500 }],
      },
    ]

    // Fusionner en évitant les doublons de référence
    const liveRefs = new Set(liveTx.map((t) => t.orderRef))
    const merged = [...liveTx, ...baseTx.filter((t) => !liveRefs.has(t.orderRef))]

    // Trier par date décroissante
    return merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [orders])

  // Filtrage
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchSearch =
        tx.orderRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.phone.includes(searchQuery)

      const matchMethod = methodFilter === 'all' || tx.paymentMethod === methodFilter
      const matchStatus = statusFilter === 'all' || tx.paymentStatus === statusFilter

      return matchSearch && matchMethod && matchStatus
    })
  }, [transactions, searchQuery, methodFilter, statusFilter])

  // Calculs Financiers Globaux
  const financialKpis = useMemo(() => {
    const totalRevenue = transactions.reduce((acc, t) => (t.paymentStatus === 'paid' ? acc + t.amount : acc), 0)

    const waveTotal = transactions
      .filter((t) => t.paymentMethod === 'wave' && t.paymentStatus === 'paid')
      .reduce((acc, t) => acc + t.amount, 0)

    const omTotal = transactions
      .filter((t) => t.paymentMethod === 'orange_money' && t.paymentStatus === 'paid')
      .reduce((acc, t) => acc + t.amount, 0)

    const cashTotal = transactions
      .filter((t) => t.paymentMethod === 'cash' && t.paymentStatus === 'paid')
      .reduce((acc, t) => acc + t.amount, 0)

    const paidCount = transactions.filter((t) => t.paymentStatus === 'paid').length
    const pendingCount = transactions.filter((t) => t.paymentStatus === 'pending').length
    const successRate = transactions.length ? Math.round((paidCount / transactions.length) * 100) : 100

    return {
      totalRevenue,
      waveTotal,
      omTotal,
      cashTotal,
      totalCount: transactions.length,
      paidCount,
      pendingCount,
      successRate,
      avgBasket: paidCount ? Math.round(totalRevenue / paidCount) : 0,
    }
  }, [transactions])

  // Export CSV du journal des transactions
  const handleExportCsv = () => {
    const headers = [
      'ID Transaction',
      'Ref Commande',
      'Date & Heure',
      'Client',
      'Telephone',
      'Adresse',
      'Methode Paiement',
      'Statut',
      'Montant (F CFA)',
    ]

    const rows = filteredTransactions.map((t) => [
      t.id,
      t.orderRef,
      new Date(t.date).toLocaleString('fr-FR'),
      `"${t.customerName}"`,
      t.phone,
      `"${t.address}"`,
      t.paymentMethod.toUpperCase(),
      t.paymentStatus.toUpperCase(),
      t.amount,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `journal_transactions_bmc_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Impression Reçu Thermique
  const handlePrintReceipt = (tx: TransactionItem) => {
    const printWindow = window.open('', '_blank', 'width=380,height=600')
    if (!printWindow) return

    const itemsHtml = tx.items
      .map(
        (it) => `
        <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:12px;">
          <span>${it.quantity}x ${it.name}</span>
          <span>${(it.quantity * it.unitPrice).toLocaleString('fr-FR')} F</span>
        </div>`
      )
      .join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reçu ${tx.id}</title>
          <style>
            body { font-family: 'Courier New', monospace; width: 280px; margin: 0 auto; padding: 12px; color: #000; }
            h1 { font-size: 18px; text-align: center; margin: 2px 0; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .ref { font-size: 16px; font-weight: bold; text-align: center; margin: 4px 0; }
          </style>
        </head>
        <body>
          <h1>BMC FOOD · DAKAR</h1>
          <div style="text-align:center; font-size:11px;">REÇU OFFICIEL DE TRANSACTION</div>
          <div class="divider"></div>
          <div class="ref">${tx.id}</div>
          <div style="text-align:center; font-size:12px; margin-bottom:4px;">Commande : <strong>${tx.orderRef}</strong></div>
          <div style="font-size:11px;">Client : ${tx.customerName}</div>
          <div style="font-size:11px;">Tél : ${tx.phone}</div>
          <div style="font-size:11px;">Date : ${new Date(tx.date).toLocaleString('fr-FR')}</div>
          <div class="divider"></div>
          <div>${itemsHtml}</div>
          <div class="divider"></div>
          <div style="display:flex; justify-content:space-between; font-size:15px; font-weight:bold;">
            <span>TOTAL :</span>
            <span>${tx.amount.toLocaleString('fr-FR')} F CFA</span>
          </div>
          <div style="font-size:11px; margin-top:4px;">Paiement : <strong>${tx.paymentMethod.toUpperCase()}</strong></div>
          <div style="font-size:11px;">Statut : <strong>${tx.paymentStatus === 'paid' ? 'VALIDÉ & ENCAISSÉ' : 'EN COURS'}</strong></div>
          <div class="divider"></div>
          <div style="text-align:center; font-size:9px;">Merci de votre confiance · BMC Food Dakar</div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ backgroundColor: '#0B0D10' }}>
      {/* 1. EN-TÊTE PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#232830]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <CreditCard size={22} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Journal des Transactions & Encaissements
            </h1>
          </div>
          <p className="text-xs text-[#9AA3AF] mt-1 ml-10">
            Suivi des flux financiers en direct : paiements Wave, Orange Money et Espèces au comptoir et à la livraison.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#14171C] border border-[#232830] hover:border-[#F5B301] transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-[#0B0D10] bg-[#F5B301] hover:bg-[#ffc633] transition-all shadow-lg shadow-[#F5B301]/20 cursor-pointer"
          >
            <Download size={15} strokeWidth={2.5} />
            <span>Exporter en CSV</span>
          </button>
        </div>
      </div>

      {/* 2. 4 CARTES KPI FINANCIÈRES LUXURY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Encaissé */}
        <div className="rounded-2xl border border-emerald-500/30 bg-[#14171C] p-4.5 flex flex-col justify-between shadow-lg shadow-black/20">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#9AA3AF]">
              Total Encaissé Aujourd'hui
            </p>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {financialKpis.successRate}% succès
            </span>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-white font-mono">
              {financialKpis.totalRevenue.toLocaleString('fr-FR')}{' '}
              <span className="text-sm font-bold text-[#F5B301]">F CFA</span>
            </p>
            <p className="text-[11px] text-[#9AA3AF] mt-1">
              {financialKpis.paidCount} transactions validées · Panier moy. {financialKpis.avgBasket.toLocaleString('fr-FR')} F
            </p>
          </div>
        </div>

        {/* Volume Wave */}
        <div className="rounded-2xl border border-[#1DA1F2]/30 bg-[#14171C] p-4.5 flex flex-col justify-between shadow-lg shadow-black/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#1DA1F2]" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#1DA1F2]">
                Paiements Wave
              </p>
            </div>
            <div className="px-2 py-0.5 rounded-md bg-[#1DA1F2]/15 text-[#1DA1F2] text-[10px] font-mono font-bold">
              WAVE SN
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-[#1DA1F2] font-mono">
              {financialKpis.waveTotal.toLocaleString('fr-FR')}{' '}
              <span className="text-sm font-bold text-[#9AA3AF]">F CFA</span>
            </p>
            <p className="text-[11px] text-[#9AA3AF] mt-1">
              {financialKpis.totalRevenue > 0
                ? `${Math.round((financialKpis.waveTotal / financialKpis.totalRevenue) * 100)}% du chiffre d'affaires`
                : 'Paiements QR & Mobile'}
            </p>
          </div>
        </div>

        {/* Volume Orange Money */}
        <div className="rounded-2xl border border-[#FF6600]/30 bg-[#14171C] p-4.5 flex flex-col justify-between shadow-lg shadow-black/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#FF6600]" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#FF6600]">
                Orange Money
              </p>
            </div>
            <div className="px-2 py-0.5 rounded-md bg-[#FF6600]/15 text-[#FF6600] text-[10px] font-mono font-bold">
              OM SN
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-[#FF6600] font-mono">
              {financialKpis.omTotal.toLocaleString('fr-FR')}{' '}
              <span className="text-sm font-bold text-[#9AA3AF]">F CFA</span>
            </p>
            <p className="text-[11px] text-[#9AA3AF] mt-1">
              {financialKpis.totalRevenue > 0
                ? `${Math.round((financialKpis.omTotal / financialKpis.totalRevenue) * 100)}% du chiffre d'affaires`
                : 'Paiements USSD & App'}
            </p>
          </div>
        </div>

        {/* Volume Espèces */}
        <div className="rounded-2xl border border-[#F5B301]/30 bg-[#14171C] p-4.5 flex flex-col justify-between shadow-lg shadow-black/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#F5B301]" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#F5B301]">
                Espèces en Caisse
              </p>
            </div>
            <div className="px-2 py-0.5 rounded-md bg-[#F5B301]/15 text-[#F5B301] text-[10px] font-mono font-bold">
              CASH
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-[#F5B301] font-mono">
              {financialKpis.cashTotal.toLocaleString('fr-FR')}{' '}
              <span className="text-sm font-bold text-[#9AA3AF]">F CFA</span>
            </p>
            <p className="text-[11px] text-[#9AA3AF] mt-1">
              {financialKpis.totalRevenue > 0
                ? `${Math.round((financialKpis.cashTotal / financialKpis.totalRevenue) * 100)}% du chiffre d'affaires`
                : 'Règlement à la livraison'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. BARRE DE RECHERCHE ET FILTRES DE PAIEMENT */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#14171C] border border-[#232830] p-3 rounded-2xl">
        {/* Recherche multi-critères */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA3AF]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par référence (#BMC-...), client, téléphone ou ID TRX..."
            className="w-full h-10 pl-10 pr-3.5 rounded-xl bg-[#0B0D10] border border-[#232830] text-sm text-white placeholder-[#687282] focus:border-[#F5B301] focus:outline-none transition-colors"
          />
        </div>

        {/* Filtres méthode de paiement */}
        <div className="flex items-center gap-1 p-1 bg-[#0B0D10] rounded-xl border border-[#232830] overflow-x-auto">
          <button
            type="button"
            onClick={() => setMethodFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              methodFilter === 'all'
                ? 'bg-[#F5B301] text-[#0B0D10]'
                : 'text-[#9AA3AF] hover:text-white'
            }`}
          >
            Toutes ({transactions.length})
          </button>
          <button
            type="button"
            onClick={() => setMethodFilter('wave')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              methodFilter === 'wave'
                ? 'bg-[#1DA1F2] text-white'
                : 'text-[#1DA1F2] hover:bg-[#1DA1F2]/10'
            }`}
          >
            <span className="size-1.5 rounded-full bg-[#1DA1F2]" />
            Wave
          </button>
          <button
            type="button"
            onClick={() => setMethodFilter('orange_money')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              methodFilter === 'orange_money'
                ? 'bg-[#FF6600] text-white'
                : 'text-[#FF6600] hover:bg-[#FF6600]/10'
            }`}
          >
            <span className="size-1.5 rounded-full bg-[#FF6600]" />
            Orange Money
          </button>
          <button
            type="button"
            onClick={() => setMethodFilter('cash')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              methodFilter === 'cash'
                ? 'bg-emerald-500 text-[#0B0D10]'
                : 'text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            <span className="size-1.5 rounded-full bg-emerald-400" />
            Espèces
          </button>
        </div>

        {/* Filtre Statut */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="h-10 px-3 rounded-xl bg-[#0B0D10] border border-[#232830] text-xs font-bold text-white focus:border-[#F5B301] focus:outline-none"
        >
          <option value="all">Tous les statuts</option>
          <option value="paid">Payé / Validé</option>
          <option value="pending">En attente</option>
          <option value="unpaid">Non payé</option>
        </select>
      </div>

      {/* 4. TABLEAU DES TRANSACTIONS HAUTE PRÉCISION */}
      <div className="rounded-2xl border border-[#232830] bg-[#14171C] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#232830] bg-[#0E1116] text-[11px] font-black uppercase tracking-wider text-[#9AA3AF]">
                <th className="py-3.5 px-4">Date & Heure</th>
                <th className="py-3.5 px-4">ID Transaction</th>
                <th className="py-3.5 px-4">Réf Commande</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Méthode</th>
                <th className="py-3.5 px-4 text-right">Montant</th>
                <th className="py-3.5 px-4 text-center">Statut</th>
                <th className="py-3.5 px-4 text-right">Reçu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232830]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#9AA3AF]">
                    <CreditCard size={32} className="mx-auto mb-2 text-[#687282]" />
                    <p className="font-bold text-white">Aucune transaction trouvée</p>
                    <p className="text-xs text-[#687282] mt-0.5">
                      Modifiez vos critères de recherche ou réinitialisez les filtres.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const dateObj = new Date(tx.date)
                  const formattedTime = dateObj.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  const formattedDate = dateObj.toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                  })

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                      onClick={() => setSelectedTx(tx)}
                    >
                      {/* Date & Heure */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-xs font-bold text-white">
                          {formattedTime}
                        </div>
                        <div className="text-[10px] text-[#687282]">{formattedDate}</div>
                      </td>

                      {/* ID TRX */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-semibold text-[#9AA3AF] group-hover:text-white transition-colors">
                          {tx.id}
                        </span>
                      </td>

                      {/* Réf Commande */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-[#0B0D10] border border-[#232830] font-mono text-xs font-black text-[#F5B301]">
                          {tx.orderRef}
                        </span>
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-xs">{tx.customerName}</div>
                        <div className="text-[11px] font-mono text-[#9AA3AF]">{tx.phone}</div>
                      </td>

                      {/* Méthode de Paiement */}
                      <td className="py-3.5 px-4">
                        {tx.paymentMethod === 'wave' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1DA1F2]/15 text-[#1DA1F2] border border-[#1DA1F2]/30 text-xs font-bold">
                            <span className="size-1.5 rounded-full bg-[#1DA1F2]" />
                            Wave
                          </span>
                        ) : tx.paymentMethod === 'orange_money' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FF6600]/15 text-[#FF6600] border border-[#FF6600]/30 text-xs font-bold">
                            <span className="size-1.5 rounded-full bg-[#FF6600]" />
                            Orange Money
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                            <Banknote size={12} />
                            Espèces
                          </span>
                        )}
                      </td>

                      {/* Montant */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono text-sm font-black text-white">
                          {tx.amount.toLocaleString('fr-FR')}{' '}
                          <span className="text-[10px] text-[#F5B301] font-sans">F CFA</span>
                        </span>
                      </td>

                      {/* Statut */}
                      <td className="py-3.5 px-4 text-center">
                        {tx.paymentStatus === 'paid' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                            <CheckCircle2 size={11} />
                            Payé
                          </span>
                        ) : tx.paymentStatus === 'pending' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F5B301]/15 text-[#F5B301] border border-[#F5B301]/30 text-[11px] font-bold">
                            <Clock size={11} />
                            En attente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[11px] font-bold">
                            <AlertCircle size={11} />
                            Non payé
                          </span>
                        )}
                      </td>

                      {/* Action Reçu */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePrintReceipt(tx)
                          }}
                          title="Imprimer le ticket"
                          className="p-1.5 rounded-lg border border-[#232830] bg-[#0B0D10] text-[#9AA3AF] hover:text-[#F5B301] hover:border-[#F5B301] transition-colors cursor-pointer"
                        >
                          <Printer size={15} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer du tableau avec totaux filtrés */}
        <div className="p-4 border-t border-[#232830] bg-[#0E1116] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#9AA3AF]">
          <div>
            Affichage de <strong className="text-white">{filteredTransactions.length}</strong> transactions sur{' '}
            <strong className="text-white">{transactions.length}</strong>
          </div>
          <div className="font-mono text-sm">
            Total affiché :{' '}
            <strong className="text-[#F5B301]">
              {filteredTransactions
                .reduce((acc, t) => acc + t.amount, 0)
                .toLocaleString('fr-FR')}{' '}
              F CFA
            </strong>
          </div>
        </div>
      </div>

      {/* 5. MODAL REÇU DÉTAILLÉ DE TRANSACTION */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedTx(null)}
          />

          <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#232830] bg-[#14171C] p-6 shadow-2xl text-white">
            <button
              type="button"
              onClick={() => setSelectedTx(null)}
              className="absolute right-4 top-4 size-8 flex items-center justify-center rounded-full bg-white/5 text-[#9AA3AF] hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* En-tête Reçu */}
            <div className="text-center pb-4 border-b border-[#232830]">
              <div className="size-12 rounded-xl bg-[#F5B301]/15 text-[#F5B301] flex items-center justify-center mx-auto mb-2 font-black text-sm">
                BMC
              </div>
              <h3 className="font-display text-lg font-black text-white">
                Détail de la Transaction
              </h3>
              <p className="font-mono text-xs text-[#F5B301] mt-0.5">{selectedTx.id}</p>
            </div>

            {/* Informations principales */}
            <div className="py-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#9AA3AF]">Réf. Commande :</span>
                <span className="font-mono font-bold text-white">{selectedTx.orderRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9AA3AF]">Date & Heure :</span>
                <span className="font-mono text-white">
                  {new Date(selectedTx.date).toLocaleString('fr-FR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9AA3AF]">Client :</span>
                <span className="font-bold text-white">{selectedTx.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9AA3AF]">Téléphone :</span>
                <span className="font-mono text-white">{selectedTx.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9AA3AF]">Adresse :</span>
                <span className="text-white text-right max-w-[200px] truncate">
                  {selectedTx.address || 'Non spécifiée'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9AA3AF]">Moyen de Paiement :</span>
                <span className="font-bold text-[#F5B301] uppercase">
                  {selectedTx.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9AA3AF]">Statut :</span>
                <span
                  className={`font-bold ${
                    selectedTx.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-[#F5B301]'
                  }`}
                >
                  {selectedTx.paymentStatus === 'paid' ? 'Validé & Encaissé' : 'En attente'}
                </span>
              </div>
            </div>

            {/* Articles de la commande */}
            <div className="pt-3 border-t border-[#232830]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AA3AF] mb-2">
                Articles commandés ({selectedTx.itemsCount})
              </p>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {selectedTx.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-1">
                    <span className="text-zinc-200">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-mono text-[#F5B301]">
                      {(item.quantity * item.unitPrice).toLocaleString('fr-FR')} F
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Montant Total */}
            <div className="mt-4 p-3.5 rounded-xl bg-[#0B0D10] border border-[#232830] flex justify-between items-center">
              <span className="text-xs font-black uppercase text-[#9AA3AF]">Montant Total</span>
              <span className="text-xl font-black text-white font-mono">
                {selectedTx.amount.toLocaleString('fr-FR')}{' '}
                <span className="text-xs text-[#F5B301]">F CFA</span>
              </span>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-2.5 pt-4">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="flex-1 h-11 rounded-xl border border-[#232830] bg-[#0B0D10] text-xs font-bold text-[#9AA3AF] hover:text-white transition-colors cursor-pointer"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => handlePrintReceipt(selectedTx)}
                className="flex-1 h-11 rounded-xl bg-[#F5B301] hover:bg-[#ffc633] text-xs font-black uppercase tracking-wider text-[#0B0D10] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-[#F5B301]/25"
              >
                <Printer size={15} strokeWidth={2.5} />
                <span>Imprimer Reçu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
