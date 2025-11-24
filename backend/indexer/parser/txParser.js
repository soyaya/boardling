export function parseTransaction(rawTx, block) {
    const tx = {
        txid: rawTx.txid,
        block_hash: block.hash,
        block_height: block.height,
        timestamp: new Date(block.time * 1000),
        size: rawTx.size,
        fee: rawTx.fee || 0,
        type: rawTx.type || 'normal',
        value_in: rawTx.valueIn || 0,
        value_out: rawTx.valueOut || 0
    };

    const inputs = rawTx.vin.map((vin, idx) => ({
        txid: tx.txid,
        index: idx,
        prev_txid: vin.txid,
        prev_index: vin.vout,
        address: vin.address,
        value: vin.value
    }));

    const outputs = rawTx.vout.map((vout, idx) => ({
        txid: tx.txid,
        index: idx,
        address: vout.address,
        value: vout.value
    }));

    return { tx, inputs, outputs };
}
