# 1. Dùng Node.js base image
FROM node:18

# 2. Tạo thư mục làm việc trong container
WORKDIR /app

# 3. Copy file khai báo package trước (tối ưu cache)
COPY package*.json ./

# 4. Cài dependencies
RUN npm install

# 5. Copy toàn bộ source vào image
COPY . .

# 6. Mở cổng 3001
EXPOSE 3001

# 7. Lệnh chạy app Node
CMD ["node", "server.js"]
