RUN cd /opt \
    && wget https://github.com/wkhtmltopdf/wkhtmltopdf/releases/download/0.12.4/wkhtmltox-0.12.4_linux-generic-amd64.tar.xz \
    && tar vxfJ wkhtmltox-0.12.4_linux-generic-amd64.tar.xz \
    && ln -s /opt/wkhtmltox/bin/wkhtmltopdf /usr/bin/wkhtmltopdf
FROM ubuntu:trusty

RUN apt-get update \
	&& apt-get install -y wget libjpeg8 fontconfig libxrender1 xfonts-base xfonts-75dpi gsfonts fonts-ubuntu-font-family-console \
	&& apt-get clean

RUN wget -O - https://deb.nodesource.com/setup_8.x | bash \
	&& apt-get install -y nodejs

WORKDIR /app/html2pdf

COPY index.js .
COPY package.json .
EXPOSE 8000

RUN npm install

ENTRYPOINT npm start
