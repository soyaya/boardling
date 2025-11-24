import { connectDB, client } from '../db/db.js';

async function recalcBalances() {
    await connectDB();

    const addresses = await client.query('SELECT address FROM addresses');
    for (const { address } of addresses.rows) {
        const totalReceived = (await client.query(
            'SELECT COALESCE(SUM(value),0) as total FROM outputs WHERE address=$1',
            [address]
        )).rows[0].total;

        const totalSent = (await client.query(
            'SELECT COALESCE(SUM(value),0) as total FROM inputs WHERE address=$1',
            [address]
        )).rows[0].total;

        const txCount = (await client.query(
            'SELECT COUNT(*) as count FROM transactions t JOIN outputs o ON o.txid=t.txid WHERE o.address=$1',
            [address]
        )).rows[0].count;

        const balance = totalReceived - totalSent;

        await client.query(
            `INSERT INTO address_balances(address,balance,total_received,total_sent,tx_count)
             VALUES($1,$2,$3,$4,$5)
             ON CONFLICT(address) DO UPDATE 
             SET balance=EXCLUDED.balance, total_received=EXCLUDED.total_received, total_sent=EXCLUDED.total_sent, tx_count=EXCLUDED.tx_count`,
             [address, balance, totalReceived, totalSent, txCount]
        );
    }

    console.log('✅ Address balances recalculated');
    process.exit(0);
}

recalcBalances().catch(console.error);
