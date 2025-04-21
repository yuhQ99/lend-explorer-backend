# Lending Explorer Backend

## 1. Yêu cầu bài toán:
- Bài toán yêu cầu thống kê số lượng vay và cho vay của 8 đồng token (CORE, Tether, stCORE, BTCB, USDC, WBTC, COREBTC và ABTC) trên CORE chain.
- Bài toán sẽ gồm 2 phần chính:
  + Số liệu tổng user vay, cho vay bao nhiêu, có phần sort từng cột, tìm kiếm theo địa chỉ + thời điểm snapshot.
  + List user vay, cho vay với từng token, top 100 user vay, cho vay nhiều nhất đối với từng token

## 2. Giải pháp để lấy số liệu:
- Số tiền user vay và cho vay thực tế được đánh giá qua các token đại diện vay và cho vay (cColendToken và Colend debt token).
- Công thức để tính số tiền user vay, cho vay thực tế:
  + Cho vay: scaled balance * liquidityIndex * price
  + Vay: scaled balance * variableBorrowIndex * price
  + Trong đó:
    + scaled balance: Số dư của user trên cColendToken hoặc Colend debt token
    + liquidityIndex: Giá trị của liquidityIndex của cColendToken
    + variableBorrowIndex: Giá trị của variableBorrowIndex của Colend debt token
    + price: Giá trị của đồng token
- Cách để tính các giá trị trên:
  + liquidityIndex và variableBorrowIndex: là giá trị được emit ở các log event (Mint, Burn, Balance Transfer). Việc crawl event log từ các block cũ có thể lấy được 2 giá trị này tại các block có event này.
  + Các event Transfer của các cColendToken hoặc Colend debt token sẽ có giá trị transfer tượng trưng của token đó. Ví dụ với token CORE, có 2 đồng vay và cho vay tương ứng là sWCORE và Variable debt WCORE. Event transfer của 1 trong 2 đồng này sẽ có giá trị **value** chính là số liệu WCORE tương ứng được transfer vào pool hoặc rút ra khỏi pool. => Từ việc tổng hơn giá trị value và tính toán với các event Transfer có thể tính được số tiền cho vay, vay thực tế của user.
  + scaled balance: Tại 1 block cụ thể, nếu lấy số tiền vay, cho vay thưc tế / (liquidityIndex hoặc variableBorrowIndex) thì sẽ tính được scaled balance của cColendToken và Colend debt token
- Sau khi tổng hợp từ block 1 tới block hiện tại thì ta sẽ có dữ liệu *scaled balance* của từng user và từng đồng token. Lấy giá trị scaled balance này và tính toán với liquidityIndex, variableBorrowIndex và price của từng đồng token ở block mới nhất ta sẽ có được số tiền vay, cho vay thực tế của từng user

## 3. Giới thiệu:
- Backend thống kê số user và số tiền user vay và cho vay. Số liệu được lấy trên CORE chain và tổng hợp từ block 0 tới block hiện tại. Các token được thống kê bao gồm: CORE, Tether, stCORE, BTCB, USDC, WBTC, COREBTC và ABTC
- Hệ thống backend sẽ có 2 phần chính:
  + Server: Phục vụ call API để lấy dữ liệu, được viết bằng nodeJS
  + Worker: Phục vụ scan block để lưu trữ số liệu vay, cho vay vào database, được viết bằng nodeJS. Data sẽ được lấy từ Flipside, một nền tảng phân tích dữ liệu on-chain.
  + Database: Phục vụ lưu trữ data crawl. Có 2 bảng chính:
    + Snapshot: Lưu trữ số liệu vay, cho vay của từng user với từng đồng token tại 1 thời điểm snapshot
    + CurrentLendingPosition: Lưu trữ tổng số user vay, cho vay, số liệu vay, cho vay của các đồng token của 1 user ở thời điểm mới nhất

- Gồm có 3 API chính:
  + /v1/current-position: API hỗ trợ cho việc trả về list tổng số user vay, cho vay, số liệu vay, cho vay của từng đồng token với user tương ứng ở **thời điểm hiện tại**. Có hỗ trợ sort theo giá trị vay, cho vay của từng đồng, trả response phân trang
  + /v1/current-position/snapshot: API lấy số lượng vay, cho vay của 1 user tại 1 thời điểm snapshot trước đó
  + /v1/current-position/details: List chi tiết số user vay, cho vay của từng đồng token. Có hỗ trợ sort + limit để lấy được top 100 user vay, cho vay với từng token

## 4. Cách chạy:
- ```cp .env.example .env```
- Thêm giá trị các trường trong .env
- Build docker:
  + Build worker scan: ```docker build -f Dockerfile.scan-lending-position -t lend-explorer-scanning:{tag} .```
  + Build server: ```docker build -t lend-explorer-backend:{tag} .```
- Run docker images:
  + Run worker: ```docker run --env-file .env --name lend-explorer-scanning lend-explorer-scanning:{tag}```
  + Run server: ```docker run --env-file .env --name lend-explorer-backend -p {externalPort}:{internalPort} lend-explorer-backend:{tag}```

## 5. Đánh giá:
1. Ðưa ra độ delay tối thiểu của API list holder, balance, tại sao?
- Trả lời: Hiện tại độ delay của API list holder, balance so với thời gian thực là tầm 15-20 phút.
- Lí do: Hiện tại toàn bộ data được crawl từ Flipside. Do Flipside có thời gian delay là 15-20 phút so với thời gian thực, nên hệ thống cũng phải delay theo Flipside.
- Giải pháp: Có thể sử dụng dữ liệu từ RPC để xử lý vì dữ liệu từ RPC sẽ sát với thời gian thực hơn. Tuy nhiên, do trên RPC chỉ hỗ trợ crawl 1 topic0 với mỗi 1 command, cộng với việc với 1 số RPC hiện tại chỉ giới hạn limit 1000 block và giới hạn response size nên việc xử lý sẽ phức tạp hơn. Sau này nếu có thời gian thì em sẽ thử để tối ưu được độ delay.
2. Respond time ở api nào là lớn nhất, đâu là nhỏ nhất, tại sao?
- Trả lời: Respond time lớn nhất là API */v1/current-position* với sortBy theo tổng số lượng vay, cho vay (USD) và API */v1/current-position/snapshot*:
- Lí do:
  + */v1/current-position* với sortBy theo tổng số lượng vay, cho vay (USD): Hiện tại flow API em đang làm là gồm 3 bước:
    + Query bảng current-lending-position để lấy data của từng user.
    + lấy tổng của (scaled balance của các đồng cColendToken, variableDeptToken) * (liquidityIndex hoặc variableBorrowIndex ở block mới nhất trên flipside tùy theo đó là vay hay cho vay) * price của từng đồng token ở block đó. Sau khi tính toán xong với từng document.
    + Sau khi tính toán xong mới thực hiện sort theo tổng số lượng vay hoặc cho vay.
  + => Vì vậy sẽ mất thời gian cho việc lấy liquidityIndex hoặc variableBorrowIndex ở pool và price ở contract oracle, xong tính toán với toàn bộ document ở db rồi mới sort toàn bộ dữ liệu ở bảng.
  + */v1/current-position/snapshot*: Flow xử lý API ở controller em đang làm như sau:
    + Query API được lấy theo timestamp. Từ timestamp query qua flipside để lấy block gần nhất với timestamp đó.
    + Query data snapshot của user gần nhất với block đó, group theo các loại token.
    + Call multicall để lấy liquidityIndex hoặc variableBorrowIndex ở pool và price của từng đồng token ở block đó
    + Thực hiện tính toán với các dữ liệu đã lấy để trả response
  + => Sẽ mất thời gian cho việc query data từ flipside để lấy block và lấy data onchain từ contract. Ngoài ra việc query data từ database bảng snapshot cũng sẽ mất thời gian mặc dù đã đánh index.
- Giải pháp tương lai: Có thể sẽ lưu giá của token cũng như variableBorrowIndex và liquidityIndex ở mỗi block vào database (có thể là cache nữa) mỗi khi user query để có thể trả response nhanh hơn ở các lần sau.
