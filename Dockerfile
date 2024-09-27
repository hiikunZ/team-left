# ベースイメージを指定
FROM node:18.17.1

# 作業ディレクトリを設定
WORKDIR /app

# キャッシュ利用で効率化するために別でコピー
COPY ./my-app/package.json ./my-app/package-lock.json ./

# ソースコードをコピー
#COPY /front ./
#COPY /.env /.env

#依存関係をインストール
RUN npm install 