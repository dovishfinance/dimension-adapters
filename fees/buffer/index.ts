import { CHAIN } from "../../helpers/chains";
import { request, gql } from "graphql-request";
import type { ChainEndpoints } from "../../adapters/types"
import { Chain } from '@defillama/sdk/build/general';
import BigNumber from "bignumber.js";
import { getTimestampAtStartOfDayUTC } from "../../utils/date";
import { Adapter } from "../../adapters/types"

const endpoints = {
  [CHAIN.ARBITRUM]: "https://subgraph.satsuma-prod.com/e66b06ce96d2/bufferfinance/arbitrum-mainnet/api"
}

export function _getDayId(timestamp: number): string {
  let dayTimestamp = Math.floor((timestamp - 16 * 3600) / 86400);
  return dayTimestamp.toString();
}

const graphs = (graphUrls: ChainEndpoints) => {
  return (chain: Chain) => {
    return async (timestamp: number) => {
      const dateId = _getDayId(timestamp);

      const graphQuery = gql
      `{
        dailyRevenueAndFee(id: ${dateId}) {
          totalFee
          settlementFee
        }
      }`;

      const graphRes = await request(graphUrls[chain], graphQuery);
      const dailyFee = new BigNumber(graphRes.dailyRevenueAndFee.settlementFee).div(1000000);
      // const protocolRev = new BigNumber(graphRes.dailyRevenueAndFee.settlementFee).div(1000000).times(0.05);
      // const userHolderRev = new BigNumber(graphRes.dailyRevenueAndFee.settlementFee).div(1000000).times(0.4);
      // const supplySideRev = new BigNumber(graphRes.dailyRevenueAndFee.settlementFee).div(1000000).times(0.55);
      const dailyRev = new BigNumber(graphRes.dailyRevenueAndFee.settlementFee).div(1000000);

      return {
        timestamp,
        dailyFees: dailyFee.toString(),
        // dailyProtocolRevenue: protocolRev.toString(),
        // dailyUserHolderRevenue: userHolderRev.toString(),
        // dailySupplySideRevenue: supplySideRev.toString(),
        dailyRevenue: dailyRev.toString()
      };
    };
  };
};


const adapter: Adapter = {
  adapter: {
    [CHAIN.ARBITRUM]: {
        fetch: graphs(endpoints)(CHAIN.ARBITRUM),
        start: async ()  => 1685654697,
    },
  }
}

export default adapter;