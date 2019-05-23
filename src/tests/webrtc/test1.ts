export async function testWEBRTC1() {

  function NewLocalServer(): Promise<LocalServer> {
    return crypto.subtle.generateKey({
      name: 'ECDSA',
      namedCurve: 'P-256'
    }, true, [
      'sign'
    ])
      .then((pair: CryptoKeyPair) => {
        return new LocalServer(pair);
      }) as Promise<LocalServer>;
  }

  const algorithms: [string, number][] = [
    ['ECDSA', 0x01],
  ];

  const hashes: [string, number][] = [
    ['SHA-1', 0x01],
    ['SHA-256', 0x02],
    ['SHA-384', 0x03],
    ['SHA-512', 0x04],
  ];

  const curves: [string, number][] = [
    ['P-256', 0x01],
    ['P-384', 0x02],
    ['P-512', 0x03],
  ];


  function ExportCryptoKeyToInternal(key: CryptoKey): Promise<Uint8Array> {
    // just support ec currently
    switch (key.algorithm.name) {
      case 'ECDSA':
        return (crypto.subtle.exportKey('raw', key) as Promise<ArrayBuffer>)
          .then((buffer: ArrayBuffer) => {
            return new Uint8Array([
              0x01,  // algorithms.find(([name]) => (name === 'ECDSA'))[1],
              curves.find(([name]) => (name === (key.algorithm as EcKeyAlgorithm).namedCurve))[1],
              ...new Uint8Array(buffer)
            ]);
          });
      default:
        return Promise.reject(new Error(`Unsupported key`));
    }
  }

  function ImportCryptoKeyFromInternal(data: Uint8Array, options: { extractable: boolean, keyUsages: string[] }): Promise<CryptoKey> {
    switch (data[0]) {
      case 0x01:
        return crypto.subtle.importKey(
          'raw',
          data.subarray(2).buffer,
          {
            name: 'ECDSA',
            namedCurve: curves.find(([, code]) => (code === data[1]))[0],
          },
          options.extractable,
          options.keyUsages
        ) as Promise<CryptoKey>;
      default:
        return Promise.reject(new Error(`Unsupported algorithm`));
    }
  }

  function SignToInternal(algorithm: RsaPssParams | EcdsaParams | AesCmacParams, key: CryptoKey, data: Uint8Array): Promise<Uint8Array> {
    return (crypto.subtle.sign(algorithm, key, data) as Promise<ArrayBuffer>)
      .then((buffer: ArrayBuffer) => {
        return new Uint8Array([
          algorithms.find(([name]) => (name === algorithm.name))[1],
          hashes.find(([name]) => (name === (algorithm as EcdsaParams).hash))[1],
          ...new Uint8Array(buffer)
        ]);
      });
  }

  function SignAlgorithmFromInternal(key: CryptoKey, signature: Uint8Array): RsaPssParams | EcdsaParams | AesCmacParams {
    switch (signature[0]) {
      case 0x01:
        return {
          name: 'ECDSA',
          hash: hashes.find(([, code]) => (code === signature[1]))[0],
        } as EcdsaParams;
      default:
        throw new Error(`Unsupported algorithm`);
    }
  }


  function VerifyFromInternal(key: CryptoKey, signature: Uint8Array, data: Uint8Array): Promise<boolean> {
    return (crypto.subtle.verify(SignAlgorithmFromInternal(key, signature), key, signature.subarray(2), data) as Promise<boolean>);
  }

  interface IPeerOffer {
    offer: RTCSessionDescription,
    signature: Uint8Array,
  }

  const peers = new Map<string, IPeerOffer>(); // id, offer

  class LocalServer {

    public readonly publicKey: CryptoKey;
    public readonly privateKey: CryptoKey;


    protected _id: Promise<Uint8Array> | null;
    protected readonly _connection: RTCPeerConnection;

    constructor({ publicKey, privateKey }: CryptoKeyPair) {
      this.publicKey = publicKey;
      this.privateKey = privateKey;

      this._id = null;
      this._connection = new RTCPeerConnection();
    }

    id(): Promise<Readonly<Uint8Array>> {
      if (this._id === null) {
        this._id = ExportCryptoKeyToInternal(this.publicKey);
      }
      return this._id;
    }

    start(): Promise<void> {
      return Promise.all([
        this.id(),
        this._connection.createOffer()
          .then((offer: RTCSessionDescriptionInit) => this._connection.setLocalDescription(offer))
          .then(() => SignToInternal({
              name: 'ECDSA',
              hash: 'SHA-256'
            },
            this.privateKey,
            new TextEncoder().encode(JSON.stringify(this._connection.localDescription))
          ))
      ])
        .then(([id, signature]: [Uint8Array, Uint8Array]) => {
          peers.set(String.fromCodePoint(...id), {
            offer: this._connection.localDescription,
            signature: signature,
          });
          console.log(peers);
        });
    }


//     localConnection.createOffer()
//   .then((offer: RTCSessionDescriptionInit) => {
//     console.log(offer);
//     return localConnection.setLocalDescription(offer);
//   })
// .then(() => remoteConnection.setRemoteDescription(localConnection.localDescription))
//     .then(() => remoteConnection.createAnswer())
//     .then(answer => remoteConnection.setLocalDescription(answer))
//     .then(() => localConnection.setRemoteDescription(remoteConnection.localDescription));

  }

  const server = await NewLocalServer();
  await server.start();


  // const uuid: string = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16).padStart(14, '0') + '-' + Date.now().toString(16).padStart(12, '0');
  // console.log(uuid);
  //
  // const localConnection = new RTCPeerConnection();
  //
  // new EventsObservable<RTCPeerConnectionEventMap>(localConnection)
  //   .on('icecandidate', (event: RTCPeerConnectionIceEvent) => {
  //     console.log('on ice candidate');
  //   })
  //   .on('negotiationneeded', (event: Event) => {
  //     console.log('on negotiationneeded');
  //   })
  //   .on('datachannel', (event: RTCDataChannelEvent) => {
  //     console.log('on datachannel');
  //   })
  // ;

}

