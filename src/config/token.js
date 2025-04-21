const tokenTypes = {
  LEND: 'LEND',
  BORROW: 'BORROW',
};

const tokenTypesList = Object.values(tokenTypes);

const tokens = {
  // CORE
  '0xf06c8db5f143fc9359d6af8bd07adc845d2f3ef8': {
    type: tokenTypes.LEND,
    underlyingToken: '0x40375c92d9faf44d2f9db9bd9ba41a3317a2404f',
  },
  '0xac98bb397b8ba98fffdd0124cdc50fa08d7c7a00': {
    type: tokenTypes.BORROW,
    underlyingToken: '0x40375c92d9faf44d2f9db9bd9ba41a3317a2404f',
  },
  // USDT
  '0x98cd652fd1f5324a1af6d64b3f6c8dcf2d8cd0d3': {
    type: tokenTypes.LEND,
    underlyingToken: '0x900101d06a7426441ae63e9ab3b9b0f63be145f1',
  },
  '0x1628434cad032060a2d49ab2d6ab63fe63c66dec': {
    type: tokenTypes.BORROW,
    underlyingToken: '0x900101d06a7426441ae63e9ab3b9b0f63be145f1',
  },
  // stCORE
  '0x9e99442af8eae003038cbd0d36d60a0ca7a0fbde': {
    type: tokenTypes.LEND,
    underlyingToken: '0xb3a8f0f0da9ffc65318aa39e55079796093029ad',
  },
  '0x287cdbae4087a57dc74da7e1c94072a99906f011': {
    type: tokenTypes.BORROW,
    underlyingToken: '0xb3a8f0f0da9ffc65318aa39e55079796093029ad',
  },
  // BTCB
  '0x2be8ca9b70ea8e8c878dd2c2793841ac617ffc4a': {
    type: tokenTypes.LEND,
    underlyingToken: '0x7a6888c85edba8e38f6c7e0485212da602761c08',
  },
  '0x9d92c320c09d52c377923a2eece6cbeef668fd7b': {
    type: tokenTypes.BORROW,
    underlyingToken: '0x7a6888c85edba8e38f6c7e0485212da602761c08',
  },
  // USDC
  '0x8f9d6649c4ac1d894bb8a26c3eed8f1c9c5f82dd': {
    type: tokenTypes.LEND,
    underlyingToken: '0xa4151b2b3e269645181dccf2d426ce75fcbdeca9',
  },
  '0x6e4df18dff9a577f7b1583b71888f45cacba5d42': {
    type: tokenTypes.BORROW,
    underlyingToken: '0xa4151b2b3e269645181dccf2d426ce75fcbdeca9',
  },
  // WBTC
  '0x2e3ea6cf100632a4a4b34f26681a6f50347775c9': {
    type: tokenTypes.LEND,
    underlyingToken: '0x5832f53d147b3d6cd4578b9cbd62425c7ea9d0bd',
  },
  '0x614917a75a00f757aa5edadb5a92675af587085e': {
    type: tokenTypes.BORROW,
    underlyingToken: '0x5832f53d147b3d6cd4578b9cbd62425c7ea9d0bd',
  },
  // COREBTC
  '0xda596bfd3acc60552aa1e7504cedb51e6ec93ab2': {
    type: tokenTypes.LEND,
    underlyingToken: '0x8034ab88c3512246bf7894f57c834dddbd1de01f',
  },
  '0xd6f6da8b1edd9d77b8c82a611cbebb4e45ceadb1': {
    type: tokenTypes.BORROW,
    underlyingToken: '0x8034ab88c3512246bf7894f57c834dddbd1de01f',
  },
  // aBTC
  '0x14587de6ba3e1df2940ecf46d26dfced6905dd63': {
    type: tokenTypes.LEND,
    underlyingToken: '0x70727228db8c7491bf0ad42c180dbf8d95b257e2',
  },
  '0xad0d9106e356c3bd1c36abf8f14fdf0b4e84f644': {
    type: tokenTypes.BORROW,
    underlyingToken: '0x70727228db8c7491bf0ad42c180dbf8d95b257e2',
  },
};

const tokensList = Object.keys(tokens);

const underlyingTokens = {
  '0x40375c92d9faf44d2f9db9bd9ba41a3317a2404f': {
    name: 'Wrapped CORE',
    symbol: 'WCORE',
    decimals: 18,
    lendToken: '0xf06c8db5f143fc9359d6af8bd07adc845d2f3ef8',
    borrowToken: '0xac98bb397b8ba98fffdd0124cdc50fa08d7c7a00',
  },
  '0x900101d06a7426441ae63e9ab3b9b0f63be145f1': {
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    lendToken: '0x98cd652fd1f5324a1af6d64b3f6c8dcf2d8cd0d3',
    borrowToken: '0x1628434cad032060a2d49ab2d6ab63fe63c66dec',
  },
  '0xb3a8f0f0da9ffc65318aa39e55079796093029ad': {
    name: 'Liquid staked CORE',
    symbol: 'stCORE',
    decimals: 18,
    lendToken: '0x9e99442af8eae003038cbd0d36d60a0ca7a0fbde',
    borrowToken: '0x287cdbae4087a57dc74da7e1c94072a99906f011',
  },
  '0x7a6888c85edba8e38f6c7e0485212da602761c08': {
    name: 'BTCB',
    symbol: 'BTCB',
    decimals: 18,
    lendToken: '0x2be8ca9b70ea8e8c878dd2c2793841ac617ffc4a',
    borrowToken: '0x9d92c320c09d52c377923a2eece6cbeef668fd7b',
  },
  '0xa4151b2b3e269645181dccf2d426ce75fcbdeca9': {
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    lendToken: '0x8f9d6649c4ac1d894bb8a26c3eed8f1c9c5f82dd',
    borrowToken: '0x6e4df18dff9a577f7b1583b71888f45cacba5d42',
  },
  '0x5832f53d147b3d6cd4578b9cbd62425c7ea9d0bd': {
    name: 'WBTC',
    symbol: 'WBTC',
    decimals: 8,
    lendToken: '0x2e3ea6cf100632a4a4b34f26681a6f50347775c9',
    borrowToken: '0x614917a75a00f757aa5edadb5a92675af587085e',
  },
  '0x8034ab88c3512246bf7894f57c834dddbd1de01f': {
    name: 'Core Wrapped BTC Token',
    symbol: 'COREBTC',
    decimals: 8,
    lendToken: '0xda596bfd3acc60552aa1e7504cedb51e6ec93ab2',
    borrowToken: '0xd6f6da8b1edd9d77b8c82a611cbebb4e45ceadb1',
  },
  '0x70727228db8c7491bf0ad42c180dbf8d95b257e2': {
    name: 'aBTC',
    symbol: 'aBTC',
    decimals: 18,
    lendToken: '0x14587de6ba3e1df2940ecf46d26dfced6905dd63',
    borrowToken: '0xad0d9106e356c3bd1c36abf8f14fdf0b4e84f644',
  },
};

const underlyingTokensList = Object.keys(underlyingTokens);
const underlyingTokensSymbolList = Object.values(underlyingTokens).map((el) => el.symbol);

const symbolAndTokenDataMapping = Object.values(underlyingTokens).reduce((o, el, idx) => {
  o[el.symbol] = {
    address: underlyingTokensList[idx],
    lendToken: el.lendToken,
    borrowToken: el.borrowToken,
    decimals: el.decimals,
  };
  return o;
}, {});

const poolAddress = '0x0cea9f0f49f30d376390e480ba32f903b43b19c5';
const multicallAddress = '0xcA11bde05977b3631167028862bE2a173976CA11';
const oracleAddress = '0x6b994bdf6dff79db2dac6ee1475b4d91b4ac1d97';
const oracleBaseCurrencyUnit = 100000000;
const supplyTopic = '0x2b627736bca15cd5381dcf80b0bf11fd197d01a037c52b927a881a10fb73ba61';
const withdrawTopic = '0x3115d1449a7b732c986cba18244e897a450f61e1bb8d589cd2e69e6c8924f9f7';
const borrowTopic = '0xb3d084820fb1a9decffb176436bd02558d15fac9b0ddfed8c465bc7359d7dce0';
const repayTopic = '0xa534c8dbe71f871f9f3530e97a74601fea17b426cae02e1c5aee42c96c784051';
const burnTopic = '0x4cf25bc1d991c17529c25213d3cc0cda295eeaad5f13f361969b12ea48015f90';
const mintTopic = '0x458f5fa412d0f69b08dd84872b0215675cc67bc1d5b6fd93300a1c3878b86196';
const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const balanceTransferTopic = '0x4beccb90f994c31aced7a23b5611020728a23d8ec5cddd1a3e9d97b96fda8666';

const address0 = new Set(['0x0000000000000000000000000000000000000000', '0x000000000000000000000000000000000000dead']);

module.exports = {
  tokenTypes,
  tokenTypesList,
  tokens,
  tokensList,
  underlyingTokens,
  underlyingTokensList,
  underlyingTokensSymbolList,
  symbolAndTokenDataMapping,
  poolAddress,
  multicallAddress,
  oracleAddress,
  oracleBaseCurrencyUnit,
  topics: {
    supply: supplyTopic,
    withdraw: withdrawTopic,
    borrow: borrowTopic,
    repay: repayTopic,
    burn: burnTopic,
    mint: mintTopic,
    transfer: transferTopic,
    balanceTransfer: balanceTransferTopic,
  },
  transferTopic,
  address0,
};
