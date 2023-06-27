import { Message } from 'protobufjs/light'
import { EMPTY_BUFFER, registerMessage, addJSON } from '@dedis/cothority/protobuf'
import models from './models.json'

addJSON(models)

export class GetElections extends Message {
  static register () { registerMessage('GetElections', GetElections) }
  constructor (properties) {
    super(properties)
    this.master = Buffer.from(this.master || EMPTY_BUFFER)
    this.signature = Buffer.from(this.signature || EMPTY_BUFFER)
  }
}

export class GetElectionsReply extends Message {
  static register () { registerMessage('GetElectionsReply', GetElectionsReply) }
}

export class Footer extends Message {
  static register () { registerMessage('Footer', Footer) }
}

export class Election extends Message {
  static register () { registerMessage('Election', Election, Footer) }
  constructor (properties) {
    super(properties)
    this.id = Buffer.from(this.id || EMPTY_BUFFER)
    this.master = Buffer.from(this.master || EMPTY_BUFFER)
    this.key = Buffer.from(this.key || EMPTY_BUFFER)
    this.masterkey = Buffer.from(this.masterkey || EMPTY_BUFFER)
    this.voted = Buffer.from(this.voted || EMPTY_BUFFER)
  }
}

export class Ballot extends Message {
  static register () { registerMessage('Ballot', Ballot) }
  constructor (properties) {
    super(properties)
    this.alpha = Buffer.from(this.alpha || EMPTY_BUFFER)
    this.beta = Buffer.from(this.beta || EMPTY_BUFFER)
    this.additionalalphas = this.additionalalphas
    this.additionalbetas = this.additionalbetas
  }
}

export class Open extends Message {
  static register () { registerMessage('Open', Open, Election) }
}

export class OpenReply extends Message {
  static register () { registerMessage('OpenReply', OpenReply) }
}

export class LookupSciper extends Message {
  static register () { registerMessage('LookupSciper', LookupSciper) }
}

export class LookupSciperReply extends Message {
  static register () { registerMessage('LookupSciperReply', LookupSciperReply) }
}

export class Reconstruct extends Message {
  static register () { registerMessage('Reconstruct', Reconstruct) }
  constructor (properties) {
    super(properties)
    this.id = Buffer.from(this.id || EMPTY_BUFFER)
  }
}

export class ReconstructReply extends Message {
  static register () { registerMessage('ReconstructReply', ReconstructReply) }
}

export class Cast extends Message {
  static register () { registerMessage('Cast', Cast) }
}

export class CastReply extends Message {
  static register () { registerMessage('CastReply', CastReply) }
}

export class Shuffle extends Message {
  static register () { registerMessage('Shuffle', Shuffle) }
}

export class ShuffleReply extends Message {
  static register () { registerMessage('ShuffleReply', ShuffleReply) }
}

export class Decrypt extends Message {
  static register () { registerMessage('Decrypt', Decrypt) }
}

export class DecryptReply extends Message {
  static register () { registerMessage('DecryptReply', DecryptReply) }
}

GetElections.register()
GetElectionsReply.register()
Footer.register()
Election.register()
Ballot.register()
Open.register()
OpenReply.register()
LookupSciper.register()
LookupSciperReply.register()
Reconstruct.register()
ReconstructReply.register()
Cast.register()
CastReply.register()
Shuffle.register()
ShuffleReply.register()
Decrypt.register()
DecryptReply.register()
