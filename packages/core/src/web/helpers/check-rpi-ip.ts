import network from 'implementations/network';

const checkRpiIp = async (): Promise<string | null> => {
  try {
    const addresses = await network.dnsLookUpAll('raspberrypi.local');
    for (let i = 0; i < addresses.length; i += 1) {
      if (addresses[i].family === 4) return addresses[i].address;
    }
  } catch (e) {
    if (e.toString().includes('ENOTFOUND')) {
      console.log('DNS server not found raspberrypi.local');
    } else {
      console.log(`Error when dns looking up raspberrypi:\n${e}`);
    }
  }
  return null;
};

export default checkRpiIp;
