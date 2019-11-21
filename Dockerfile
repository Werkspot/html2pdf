FROM ubuntu:trusty

RUN apt-get update \
	&& apt-get install -y wget libjpeg8 fontconfig libxrender1 xfonts-base xfonts-75dpi gsfonts fonts-ubuntu-font-family-console \
	&& apt-get clean

RUN wget -O - https://deb.nodesource.com/setup_8.x | bash \
	&& apt-get install -y nodejs

WORKDIR /app/html2pdf

USER nobody
COPY wkhtmltopdf /usr/bin/wkhtmltopdf
COPY index.js .

EXPOSE 8000
ENTRYPOINT node index.js
