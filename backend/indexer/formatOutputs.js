// utils/formatOutputs.js
export function formatOutput(vout) {
  const addresses = vout.scriptPubKey?.addresses || [];

  return {
    id: vout.n,
    txid: vout.txid,
    vout_index: vout.n,
    value: vout.value,
    scriptpubkey: JSON.stringify(vout.scriptPubKey || {}),
    address: addresses.length > 0 ? addresses[0] : null,
    script_pub_key: null,
    vout: null
  };
}
export const addressStats = {};
export function updateAddressStats(addressStats, address, height, timestamp) {
  if (!addressStats[address]) {
    addressStats[address] = {
      first_seen: { height, timestamp },
      last_seen: { height, timestamp },
      txs: []
    }
  }

  // Update last seen
  addressStats[address].last_seen = { height, timestamp }
}

