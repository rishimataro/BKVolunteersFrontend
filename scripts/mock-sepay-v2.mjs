import http from 'node:http'
import process from 'node:process'
import { URL } from 'node:url'

const port = Number(process.env.MOCK_SEPAY_PORT || 4010)
const token = process.env.MOCK_SEPAY_TOKEN || 'test-sepay-api-token'
const sessionSeed = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
const sessionDigits = sessionSeed
    .replace(/[^0-9]/g, '')
    .padEnd(10, '7')
    .slice(0, 10)

const clone = (value) => JSON.parse(JSON.stringify(value))

const baseBankAccount = {
    id: 'acc_demo_bidv_1',
    account_holder_name: 'DOAN THANH NIEN DHBK-DN',
    account_number: '0000000001',
    accumulated: 0,
    last_transaction: null,
    label: 'Demo fundraising account',
    active: 1,
    bank_short_name: 'BIDV',
    bank_full_name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',
    bank_code: 'BIDV',
}

const state = {
    bankAccounts: [clone(baseBankAccount)],
    transactions: [],
    virtualAccounts: [],
    orders: [],
    counters: {
        order: 1,
        va: 1,
        transaction: 1,
    },
}

const sendJson = (res, status, payload) => {
    res.writeHead(status, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(payload))
}

const notFound = (res) =>
    sendJson(res, 404, {
        status: 'error',
        message: 'Not found',
        data: null,
    })

const unauthorized = (res) =>
    sendJson(res, 401, {
        status: 'error',
        message: 'Unauthorized',
        data: null,
    })

const readJsonBody = async (req) =>
    new Promise((resolve, reject) => {
        let raw = ''
        req.on('data', (chunk) => {
            raw += chunk
        })
        req.on('end', () => {
            if (!raw.trim()) {
                resolve({})
                return
            }

            try {
                resolve(JSON.parse(raw))
            } catch (error) {
                reject(error)
            }
        })
        req.on('error', reject)
    })

const matchesQuery = (value, query) => {
    if (!query) return true
    return String(value ?? '')
        .toLowerCase()
        .includes(String(query).toLowerCase())
}

const requireAuth = (req, res) => {
    if (req.url?.startsWith('/__test/')) {
        return true
    }

    const auth = req.headers.authorization
    if (!auth || auth !== `Bearer ${token}`) {
        unauthorized(res)
        return false
    }

    return true
}

const nextMockId = (prefix, counterKey) =>
    `${prefix}_${sessionSeed}_${String(state.counters[counterKey]++).padStart(4, '0')}`

const nextVaNumber = (prefix = 'VA') => {
    const sequence = String(state.counters.va).padStart(4, '0')
    return `${String(prefix)}${sessionDigits}${sequence}`.slice(0, 30)
}

const resetState = () => {
    state.bankAccounts = [clone(baseBankAccount)]
    state.transactions = []
    state.virtualAccounts = []
    state.orders = []
    state.counters = {
        order: 1,
        va: 1,
        transaction: 1,
    }
}

const server = http.createServer(async (req, res) => {
    if (!req.url || !req.method) {
        notFound(res)
        return
    }

    if (!requireAuth(req, res)) {
        return
    }

    const requestUrl = new URL(req.url, `http://127.0.0.1:${port}`)
    const pathname = requestUrl.pathname

    if (req.method === 'GET' && pathname === '/__health') {
        sendJson(res, 200, { status: 'ok' })
        return
    }

    if (req.method === 'POST' && pathname === '/__test/reset') {
        resetState()
        sendJson(res, 200, { status: 'ok', data: { reset: true } })
        return
    }

    if (req.method === 'POST' && pathname === '/__test/transactions') {
        const body = await readJsonBody(req)
        const items = Array.isArray(body.transactions) ? body.transactions : []
        for (const item of items) {
            const nextId = item.id ?? nextMockId('tx_mock', 'transaction')
            state.transactions.unshift({
                id: String(nextId),
                bank_account_id: String(
                    item.bank_account_id ?? baseBankAccount.id,
                ),
                account_number: String(
                    item.account_number ?? baseBankAccount.account_number,
                ),
                transaction_content: item.transaction_content ?? item.content ?? '',
                transaction_date:
                    item.transaction_date ?? new Date().toISOString(),
                amount_in: Number(item.amount_in ?? item.transferAmount ?? 0),
                reference_number:
                    item.reference_number ?? item.referenceCode ?? null,
                code: item.code ?? null,
                va_id: item.va_id ?? null,
                webhook_success:
                    item.webhook_success === undefined
                        ? null
                        : item.webhook_success,
            })
        }

        sendJson(res, 201, {
            status: 'success',
            data: { inserted: items.length },
        })
        return
    }

    if (req.method === 'GET' && pathname === '/v2/bank-accounts') {
        const q = requestUrl.searchParams.get('q')
        const bankShortName = requestUrl.searchParams.get('bank_short_name')
        const active = requestUrl.searchParams.get('active')

        const data = state.bankAccounts.filter((account) => {
            if (bankShortName && account.bank_short_name !== bankShortName) {
                return false
            }
            if (active !== null && String(account.active) !== active) {
                return false
            }
            return (
                matchesQuery(account.account_holder_name, q) ||
                matchesQuery(account.account_number, q) ||
                matchesQuery(account.label, q)
            )
        })

        sendJson(res, 200, { status: 'success', data })
        return
    }

    if (req.method === 'GET' && pathname === '/v2/transactions') {
        const bankAccountId = requestUrl.searchParams.get('bank_account_id')
        const q = requestUrl.searchParams.get('q')
        const sinceId = requestUrl.searchParams.get('since_id')

        const data = state.transactions.filter((transaction) => {
            if (
                bankAccountId &&
                String(transaction.bank_account_id) !== bankAccountId
            ) {
                return false
            }
            if (
                sinceId &&
                String(transaction.id) === sinceId
            ) {
                return false
            }
            return (
                matchesQuery(transaction.transaction_content, q) ||
                matchesQuery(transaction.reference_number, q) ||
                matchesQuery(transaction.code, q)
            )
        })

        sendJson(res, 200, { status: 'success', data })
        return
    }

    const vaListMatch = pathname.match(/^\/v2\/bank-accounts\/([^/]+)\/va$/)
    if (req.method === 'GET' && vaListMatch) {
        const bankAccountId = decodeURIComponent(vaListMatch[1])
        const data = state.virtualAccounts.filter(
            (item) => item.bank_account_id === bankAccountId,
        )
        sendJson(res, 200, { status: 'success', data })
        return
    }

    const orderCreateMatch = pathname.match(/^\/v2\/bank-accounts\/([^/]+)\/orders$/)
    if (req.method === 'POST' && orderCreateMatch) {
        const bankAccountId = decodeURIComponent(orderCreateMatch[1])
        const body = await readJsonBody(req)
        const order = {
            id: nextMockId('order', 'order'),
            bank_account_id: bankAccountId,
            order_code: String(body.order_code ?? `BKV-ORDER-${Date.now()}`),
            amount: Number(body.amount ?? 0),
            paid_amount: 0,
            status: 'PENDING',
            va_prefix: body.va_prefix ?? null,
            va_holder_name: body.va_holder_name ?? null,
        }
        state.orders.push(order)
        sendJson(res, 201, { status: 'success', data: order })
        return
    }

    const orderDetailMatch = pathname.match(
        /^\/v2\/bank-accounts\/([^/]+)\/orders\/([^/]+)$/,
    )
    if (req.method === 'GET' && orderDetailMatch) {
        const orderId = decodeURIComponent(orderDetailMatch[2])
        const order = state.orders.find((item) => item.id === orderId)
        if (!order) {
            notFound(res)
            return
        }
        sendJson(res, 200, { status: 'success', data: order })
        return
    }

    const orderVaMatch = pathname.match(
        /^\/v2\/bank-accounts\/([^/]+)\/orders\/([^/]+)\/va$/,
    )
    if (req.method === 'POST' && orderVaMatch) {
        const bankAccountId = decodeURIComponent(orderVaMatch[1])
        const orderId = decodeURIComponent(orderVaMatch[2])
        const order = state.orders.find((item) => item.id === orderId)
        if (!order) {
            notFound(res)
            return
        }

        const body = await readJsonBody(req)
        const vaNumber = nextVaNumber(body.va_prefix ?? order.va_prefix ?? 'VA')
        const va = {
            id: nextMockId('va', 'va'),
            bank_account_id: bankAccountId,
            va: vaNumber,
            va_number: vaNumber,
            va_holder_name:
                body.va_holder_name ?? order.va_holder_name ?? null,
            label: order.order_code,
            active: 1,
            official: 1,
            static: 0,
            expired_at:
                body.duration && Number(body.duration) > 0
                    ? new Date(
                          Date.now() + Number(body.duration) * 1000,
                      ).toISOString()
                    : null,
            order_id: orderId,
        }
        state.virtualAccounts.push(va)
        sendJson(res, 201, { status: 'success', data: va })
        return
    }

    notFound(res)
})

server.listen(port, '127.0.0.1', () => {
    process.stdout.write(
        `[mock-sepay-v2] listening on http://127.0.0.1:${port}\n`,
    )
})

process.on('SIGTERM', () => {
    server.close(() => process.exit(0))
})

process.on('SIGINT', () => {
    server.close(() => process.exit(0))
})
