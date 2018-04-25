# How the EPFL e-voting system works

Running an election seems simple, doesn't it? Get some paper ballots, mark them, put them intoa ballot box, and then count them.

Running an electronic seems simple as well: make electronic ballots, put them in an electronic ballot box and count them, right?

But for voters to have confidence in the outcome of an election, they need to be able to see what's going on. That's why there are protocols for how ballot papers are handled, how ballot boxes are opened, and who is present when they are counted.

If we want voters using an e-voting system to have the same confidence, we need to solve those same problems:
1. Providing transparency that the votes were counted correctly
1. Protecting the privacy of the voter
1. Distribute the responsibility for safeguarding the privacy of the voters

## Transparency and distributed trust

In a traditional voting system implemented with a simple database in a central server, the first problem we see is that voters send their votes in to the voting system and hope that the right answer comes out. Since the database table is held by the voting system in a "black box", they have no way to audit the system.

A solution to this is that the voting system can make each transaction it receives public, and do so in a way that proves that the transactions that have already been made public were not falisfied later. In this system, non-falsifiable, durable transparent logging is implemented with a Cothority, a cooperative authority of nodes who work together to maintain a Skipchain. [3,5]

## Protecting privacy: Shuffling the ballots

If the voters encrypt their votes via public key encryption before they send them in to the voting system, they can have privacy. But the voting system must be able to unlock the votes later, in order to count them. And once the votes are unlocked, the privacy is lost.

What is needed is to separate the votes from who cast them, so that the votes can be unlocked without losing privacy. In this system, privacy is assured using ideas from Andrew Neff, and from the Helios voting system [1,2].

## Distributing secret key material

No single node can hold the keys for decryption alone, or else that node could violate the privacy or even falsify the votes. A Distributed Key Generation algorithm is used to ensure that each election has a public key to use to encrypt the ballots, but the private key to unlock them later is not available in any one single server. [4]

## That's great, now _show me the code_!

- [Server side](https://github.com/dedis/cothority/tree/evoting/evoting)
- [HTML/JS UI](https://github.com/dedis/epfl-evoting/tree/master/evoting/frontend)
- [Status UI](https://github.com/dedis/student_17_cothority-web/tree/evoting)

## Related work in e-voting in Switzerland

There are other aspects of e-voting that need to be taken into consideration. The security of the device making the vote is a serious concern, because a compromised browser or smartphone might change the ballot before it is cast. See the [CHvote specification](https://chvote.virvum.ch/about) for an approach to solving this "cast as intended" problem which is currently [being implemented](https://www.ge.ch/dossier/chvote-plateforme-vote-electronique-du-canton-geneve) by the Canton of Geneva.

The Swiss Post is also [active in e-voting](https://www.post.ch/en/business/a-z-of-subjects/industry-solutions/swiss-post-e-voting). Their [blog](https://blog.evoting.ch/en) explains the issues involved in scaling up e-voting in a democracy like Switzerland.

# What you see on the E-voting status page

On the top of the page, you can choose between the test and live configurations.

In the middle of the page, you can see the list of nodes which are working together to witness the election, and hold each other accountable for the correct implementation of the transparency skipchain, the shuffling, and decryption operations.

At the bottom of the page, you can see a live view of the skipchains for elections run on this system. Depending on when you view it, you may see the election config and some ballots cast. When an election is finalized and the votes are unlocked, there are a series of "Ballot shuffle operations" and "Partial decryption operations" which are permanently recorded onto the skipchain. Because you are looking at the skipchain, you'll see that some blocks are skipped over. By following links from the blocks you have, you can find the blocks that are skipped. For efficiency, this web page does not follow all of those links, but someone who wanted to audit the election would be able to.

When all of the partial decryption operations are done, the votes are in plaintext. They can be downloaded, decoded, and counted.

# Who

The EPFL e-voting system is brought to you by:
* [The Vice Presidency for Information Systems (VPSI)](https://direction.epfl.ch/VPSI): project sponsorship, project management, and hosting
* [DEDIS lab](http://dedis.epfl.ch): research, implementation

Witness servers have been graciously operated by ENAC, SB, SV, IC and GNU Generation. Neither DEDIS nor VPSI have access to these witness servers.

## References
[1] **Verifiable Mixing (Shuffling) of ElGamal Pairs**; *C. Andrew Neff*, 2004\
[2] **Helios: Web-based Open-Audit Voting**; *Ben Adida*, 2008\
[3] **Decentralizing authorities into scalable strongest-link cothorities**: *Ford et. al.*, 2015\
[4] **Secure distributed key generation for discrete-log based cryptosystems**; *Gennaro et. al.*, 1999\
[5] **[How Do You Know it is on the Blockchain? With a Skipchain](https://bford.github.io/2017/08/01/skipchain/)**; *Ford*, 2017
