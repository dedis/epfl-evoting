# How the EPFL e-voting system works

Electronic voting seems like it should be so simple. Like e-mail... it's the same as regular mail, but with computers!

But when you look more closely at how voting works, and how to make sure that the voters have confidence in the results, adding computers into the mix opens up new problems and new possible solutions.

Electronic voting has been around for decades, just think of the online polls used for marketing purposes, political purposes, and entertainment purposes. But online polls often deliver surprising or inaccurate results, as a result of people casting too many votes, or the votes being counted or miscounted in ways that are not transparent to the voters. Furthermore, with typical online polls, you give up your privacy to whoever is in control of the tabulation system. 

And even if you could somehow trust the one administrator to respect your privacy, wouldn't it be better if you could distribute the responsibility for your privacy, so that several unrelated institutions would have to collude to compromise the security of the election?

Thus, some problems that need to be solved to make a voting system are:
2. Providing transparency that the votes were counted correctly
1. Protecting the privacy of the voter
3. Distribute the responsibility for safeguarding the privacy of the voters

Before we look at how the EPFL e-voting system works, it would be helpful to imagine how to implement an online poll. The simplest way would be to have one database table like this:

| Voter | Candidate 1 | Candidate 2 | Candidate 3 |
| ------| ----------- | ----------- | ----------- |
| Alice | 1           | 0           | 1 |
| Bob   | 0           | 1           | 1 |
| *Total* | 1 | 1 | 2 |

In this election, Alice and Bob each have two votes to use among three candidates, much like the EPFL elections.

## Transparency and distributed trust

The first problem we see is that Alice and Bob send their votes in to the voting system and hope that the
right answer comes out. Since the database table is held by the voting system in a "black box", they have no way to audit the system.

A solution to this is that the voting system can make each transaction it receives public, and do so in a way that proves that the transactions that have already been made public were not falisfied later. In this system, non-falsifiable, durable transparent logging is implemented with a Cothority, a cooperative authority of nodes who work together to maintain a Skipchain. [3,5]

## Protecting privacy: Shuffling the ballots

If Alice and Bob convert their votes into data and hide it via public key encryption before they send it in to the voting system, they can have privacy. But the voting system must be able to unlock the votes later, in order to count them. And once the votes are unlocked, the privacy is lost.

What is needed is to separate the votes from who cast them, so that the votes can be unlocked without losing privacy. In this system, privacy is assured using ideas from Andrew Neff, and from the Helios voting system [1,2].

## Distributing secret key material

No single node can hold the keys for decryption alone, or else that node could violate the privacy or even falsify the votes. A Distributed Key Generation algorithm is used to ensure that each election has a public key to use to encrypt the ballots, but the private key to unlock them later is not available in any one single server. [4]

## That's great, but "show me the code"

- [Server side](https://github.com/dedis/cothority/tree/evoting/evoting)
- [HTML/JS UI](https://github.com/dedis/epfl-evoting/tree/master/evoting/frontend)
- [Status UI](https://github.com/dedis/student_17_cothority-web/tree/evoting)

## Related work in e-voting

There are other aspects of e-voting that need to be taken into consideration. The security of the device making the vote is a serious concern, because a compromised browser or smartphone might change the ballot before it is cast. See the [CHvote specification](https://chvote.virvum.ch/about) for an approach to solving this "cast as intended" problem which is currently [being implemented](https://republique-et-canton-de-geneve.github.io/index-en.html) by the Canton of Geneva.

# What you see on the E-voting status page

On the top of the page, you can choose between the test configuration, and the live configuration.

In the middle of the page, you can see the list of nodes which are working together to witness the election, and hold each other accountable for the correct implementation of the transparency skipchain, and the shuffling, and decryption operations.

At the bottom of the page, you can see a live view of the skipchains for elections run on this system. Depending on when you view it, you may see the election config and some ballots cast. When an election is finalized and the votes are unlocked, there are a series of "Ballot shuffle operations" and "Partial decryption operations" which are permanently recorded onto the skipchain.

When all of the partial decryption operations are done, the votes are in plaintext. They can be downloaded and counted with a Javascript application.

# Who

The EPFL e-voting system is brought to you by:
* [The Vice Presidency for Information Systems (VPSI)](https://direction.epfl.ch/VPSI): project sponsorship, project management, and hosting
* [DEDIS lab](http://dedis.epfl.ch): research, implementation

Witness servers have been graciously operated by ENAC, SB, SV, IC and GNU Generation.

## References
[1] **Verifiable Mixing (Shuffling) of ElGamal Pairs**; *C. Andrew Neff*, 2004\
[2] **Helios: Web-based Open-Audit Voting**; *Ben Adida*, 2008\
[3] **Decentralizing authorities into scalable strongest-link cothorities**: *Ford et. al.*, 2015\
[4] **Secure distributed key generation for discrete-log based cryptosystems**; *Gennaro et. al.*, 1999\
[5] **[How Do You Know it is on the Blockchain? With a Skipchain](https://bford.github.io/2017/08/01/skipchain/)**; *Ford*, 2017
