FROM node
RUN apt-get update && apt-get install -y wget xz-utils fontconfig libxrender1 xfonts-base xfonts-75dpi libxext6 && apt-get autoremove && apt-get clean
RUN cd /opt \
    && wget https://github.com/wkhtmltopdf/wkhtmltopdf/releases/download/0.12.4/wkhtmltox-0.12.4_linux-generic-amd64.tar.xz \
    && tar vxfJ wkhtmltox-0.12.4_linux-generic-amd64.tar.xz \
    && ln -s /opt/wkhtmltox/bin/wkhtmltopdf /usr/bin/wkhtmltopdf
WORKDIR /app/html2pdf
COPY index.js .
COPY package.json .
EXPOSE 8000
RUN npm install
ENTRYPOINT npm start
