FROM jenkins:2.7.1

# Add script
USER root
ADD ./ssh-keygen.sh /usr/local/bin/

# JDK 7
RUN apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 \
    --recv-keys 58118E89F3A912897C070ADBF76221572C52609D
RUN echo "deb http://apt.dockerproject.org/repo debian-jessie main" > /etc/apt/sources.list.d/docker.list

RUN apt-get update && apt-get install -y openjdk-7-jdk
RUN apt-get remove -y openjdk-8-jdk
RUN apt-get autoremove -y
#fontconfig fonts-dejavu-extra hicolor-icon-theme libatk-wrapper-java libatk-wrapper-java-jni libatk1.0-0 libatk1.0-data libcairo2 libdatrie1 libdrm-intel1 libdrm-nouveau2 libdrm-radeon1 libdrm2 libelf1 libgconf2-4 libgdk-pixbuf2.0-0 libgdk-pixbuf2.0-common libgif4 libgl1-mesa-dri libgl1-mesa-glx libglapi-mesa libgnome2-0 libgraphite2-3 libgtk2.0-0 libgtk2.0-bin libgtk2.0-common libharfbuzz0b libice-dev libjasper1 libjbig0 libllvm3.5 libpango-1.0-0 libpangocairo-1.0-0 libpangoft2-1.0-0 libpciaccess0 libpixman-1-0 libpthread-stubs0-dev libsm-dev libthai-data libthai0 libtiff5 libtxc-dxtn-s2tc0 libx11-dev libx11-doc libxau-dev libxcb-dri2-0 libxcb-dri3-0 libxcb-glx0 libxcb-present0 libxcb-render0 libxcb-shm0 libxcb-sync1 libxcb1-dev libxcomposite1 libxcursor1 libxdamage1 libxdmcp-dev libxfixes3 libxinerama1 libxrandr2 libxshmfence1 libxt-dev libxt6 libxxf86vm1 openjdk-7-jre x11proto-core-dev x11proto-input-dev x11proto-kb-dev xorg-sgml-doctools xtrans-dev
# Add hosts
USER root
ADD ./hosts /tmp/
ADD ./hosts.sh /usr/local/bin/
RUN /usr/local/bin/hosts.sh

# Add plugins
USER root
COPY plugins.txt /usr/share/jenkins/ref/
RUN /usr/local/bin/plugins.sh /usr/share/jenkins/ref/plugins.txt

# Start jenkins
USER jenkins
CMD ["/usr/local/bin/jenkins.sh"]
