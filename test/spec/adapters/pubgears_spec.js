import { expect } from 'chai';
import Adapter from 'src/adapters/pubgears'
import bidmanager from 'src/bidmanager'

describe('PubGearsAdapter', () => {
  var adapter
  beforeEach(() => {
    adapter = new Adapter()
  })

  describe('request function', () => {
    beforeEach(() => {
      sinon.spy(document, 'createElement')
    })

    afterEach(() => {
      document.createElement.restore && document.createElement.restore()
      var s = document.getElementById('pg-header-tag')
      if (s) { s.parentNode.removeChild(s) }
    })

    it('has `#callBids()` method', () => {
      expect(adapter.callBids).to.exist.and.to.be.a('function')
    })

    it('requires bids to make script', () => {
      adapter.callBids({bids: []})
      expect(document.createElement.notCalled).to.be.ok
    })

    it('creates script when passed bids', () => {
      adapter.callBids({
        bidderCode: 'pubgears',
        bids: [
          {
            bidder: 'pubgears',
            sizes: [ [300, 250] ],
            adUnitCode: 'foo123/header-bid-tag',
            params: {
              publisherName: 'integration',
              pubZone: 'testpub.com/combined'
            }
          }
        ]
      })

      sinon.assert.calledWith(document.createElement, 'script')
    })

    it('should assign attributes to script', () => {
      adapter.callBids({
        bidderCode: 'pubgears',
        bids: [
          {
            bidder: 'pubgears',
            sizes: [ [300, 250] ],
            adUnitCode: 'foo123/header-bid-tag',
            params: {
              publisherName: 'integration',
              pubZone: 'testpub.com/combined'
            }
          },
          {
            bidder: 'pubgears',
            sizes: [ [160, 600] ],
            adUnitCode: 'foo123/header-bid-tag',
            params: {
              publisherName: 'integration',
              pubZone: 'testpub.com/combined'
            }
          }
        ]
      })
      var script = document.createElement.returnValues[0]
      var slots = script.getAttribute('data-bsm-slot-list')
      expect(slots).to.equal('testpub.com/combined@300x250 testpub.com/combined@160x600')
      expect(script.getAttribute('data-bsm-flag')).to.equal('true')
      expect(script.getAttribute('data-bsm-pub')).to.equal('integration')
      expect(script.getAttribute('src')).to.equal('//c.pubgears.com/tags/h')
      expect(script.id).to.equal('pg-header-tag')
    })

    it('should reuse existing script when called twice', () => {
      var params = {
        bidderCode: 'pubgears',
        bids: [
          {
            bidder: 'pubgears',
            sizes: [ [300, 250] ],
            adUnitCode: 'foo123/header-bid-tag',
            params: {
              publisherName: 'integration',
              pubZone: 'testpub.com/combined'
            }
          },
          {
            bidder: 'pubgears',
            sizes: [ [160, 600] ],
            adUnitCode: 'foo123/header-bid-tag',
            params: {
              publisherName: 'integration',
              pubZone: 'testpub.com/combined'
            }
          }
        ]
      }
      adapter.callBids(params)
      expect(document.createElement.calledOnce).to.be.true
      adapter.callBids(params)
      expect(document.createElement.calledOnce).to.be.true
    })

    it('should register event listeners', () => {
      var script = document.createElement('script')
      script.id = 'pg-header-tag'
      var spy = sinon.spy(script, 'addEventListener')
      document.body.appendChild(script)
      var params = {
        bidderCode: 'pubgears',
        bids: [
          {
            bidder: 'pubgears',
            sizes: [ [300, 250] ],
            adUnitCode: 'foo123/header-bid-tag',
            params: {
              publisherName: 'integration',
              pubZone: 'testpub.com/combined'
            }
          },
          {
            bidder: 'pubgears',
            sizes: [ [160, 600] ],
            adUnitCode: 'foo123/header-bid-tag',
            params: {
              publisherName: 'integration',
              pubZone: 'testpub.com/combined'
            }
          }
        ]
      }
      adapter.callBids(params)

      expect(spy.calledWith('onResourceComplete')).to.be.ok
    })
    it('should dispatch the `rerunAuction` event when called twice', () => {
      var params = {
        bidderCode: 'pubgears',
        bids: [
          {
            bidder: 'pubgears',
            sizes: [ [ 300, 250 ] ],
            adUnitCode: 'foo123/header-bid-tag',
            params: {
              publisherName: 'integration',
              pubZone: 'testpub.com/combined'
            }
          },
        ]
      };
      adapter.callBids(params)
      var script = document.createElement.returnValues[0]
      sinon.spy(script, 'dispatchEvent')
      adapter.callBids(params)
      expect(script.dispatchEvent.calledOnce).to.be.ok
    })
    it('should dispatch the `rerunAuction` event with slot list in details', () => {
      var params = {
        bidderCode: 'pubgears',
        bids: [
          {
            bidder: 'pubgears',
            sizes: [ [300, 250] ],
            adUnitCode: 'foo123/header-bid-tag',
            params: {
              publisherName: 'integration',
              pubZone: 'testpub.com/combined'
            }
          },
          {
            bidder: 'pubgears',
            sizes: [ [160, 600] ],
            adUnitCode: 'foo123/header-bid-tag',
            params: {
              publisherName: 'integration',
              pubZone: 'testpub.com/combined'
            }
          }
        ]
      };
      var expected = 'testpub.com/combined@300x250 testpub.com/combined@160x600'
      adapter.callBids(params)
      var script = document.createElement.returnValues[0]
      sinon.spy(script, 'dispatchEvent')
      adapter.callBids(params)
      expect(script.dispatchEvent.calledOnce).to.be.ok
      var eventDetails = script.dispatchEvent.getCall(0).args[0]
      expect(eventDetails).to.have.property('detail')
      expect(eventDetails.detail).to.have.property('data')
      expect(eventDetails.detail.data).to.have.property('slot_list')
      expect(eventDetails.detail.data.slot_list).to.equal(expected)
    })
  })

  describe('bids received', () => {
    beforeEach(() => {
      sinon.spy(bidmanager, 'addBidResponse')
    })

    afterEach(() => {
      bidmanager.addBidResponse.restore()
    })

    it('should call bidManager.addBidResponse() when bid received', () => {
      var options = {
        bubbles: false,
        cancelable: false,
        detail: {
          prices: [0, 50, 1000],
          resource: {
            position: 'atf',
            pub_zone: 'testpub.com/combined',
            size: '300x250'
          }
        }
      }

      adapter.callBids({
        bidderCode: 'pubgears',
        bids: [
          {
            bidder: 'pubgears',
            sizes: [ [300, 250] ],
            adUnitCode: 'foo123/header-bid-tag',
            params: {
              publisherName: 'integration',
              pubZone: 'testpub.com/combined'
            }
          },
          {
            bidder: 'pubgears',
            sizes: [ [160, 600] ],
            adUnitCode: 'foo123/header-bid-tag',
            params: {
              publisherName: 'integration',
              pubZone: 'testpub.com/combined'
            }
          }
        ]

      })
      var script = document.getElementById('pg-header-tag')
      var event = new window.CustomEvent('onResourceComplete', options)
      script.dispatchEvent(event)

      expect(bidmanager.addBidResponse.calledOnce).to.be.ok
    })

    it('should send correct bid response object when receiving onResourceComplete event', () => {
      expect(bidmanager.addBidResponse.calledOnce).to.not.be.ok
      var bid = {
        bidder: 'pubgears',
        sizes: [ [300, 250] ],
        adUnitCode: 'foo123/header-bid-tag',
        params: {
          publisherName: 'integration',
          pubZone: 'testpub.com/combined'
        }
      }

      adapter.callBids({
        bidderCode: 'pubgears',
        bids: [ bid ]
      })

      var script = document.getElementById('pg-header-tag')

      script.dispatchEvent(new window.CustomEvent('onResourceComplete', {
        bubbles: false,
        cancelable: false,
        detail: {
          prices: [ 1500 ],
          resource: {
            position: 'atf',
            pub_zone: 'testpub.com/combined',
            size: '300x250'
          }
        }
      }));

      var args = bidmanager.addBidResponse.getCall(0).args
      expect(args).to.have.length(2)
      var bidResponse = args[1]
      expect(bidResponse.ad).to.contain(bid.params.pubZone)
    })

    it('should send $0 bid as no-bid response', () => {
      var bid = {
        bidder: 'pubgears',
        sizes: [ [300, 250] ],
        adUnitCode: 'foo123/header-bid-tag',
        params: {
          publisherName: 'integration',
          pubZone: 'testpub.com/combined'
        }
      }

      adapter.callBids({
        bidderCode: 'pubgears',
        bids: [ bid ]
      })

      var options = {
        bubbles: false,
        cancelable: false,
        detail: {
          prices: [ 0 ],
          resource: {
            position: 'atf',
            pub_zone: 'testpub.com/combined',
            size: '300x250'
          }
        }
      }
      var script = document.getElementById('pg-header-tag')
      var event = new window.CustomEvent('onResourceComplete', options)

      bidmanager.addBidResponse.reset()
      script.dispatchEvent(event)

      var args = bidmanager.addBidResponse.getCall(0).args
      var bidResponse = args[1]
      expect(bidResponse).to.be.a('object')
      expect(bidResponse.getStatusCode()).to.equal(2)
    })
    it('should not send multiple bid responses to the same bid call', () => {
      var bid = {
        bidder: 'pubgears',
        sizes: [ [300, 250] ],
        adUnitCode: 'foo123/header-bid-tag',
        params: {
          publisherName: 'integration',
          pubZone: 'testpub.com/combined'
        }
      }

      adapter.callBids({
        bidderCode: 'pubgears',
        bids: [ bid ]
      })

      bidmanager.addBidResponse.reset()
      var script = document.getElementById('pg-header-tag');
      script.dispatchEvent(new window.CustomEvent('onResourceComplete', {
        bubbles: false,
        cancelable: false,
        detail: {
          prices: [ 0 ],
          resource: {
            position: 'atf',
            pub_zone: 'testpub.com/combined',
            size: '300x250'
          }
        }
      }));
      script.dispatchEvent(new window.CustomEvent('onResourceComplete', {
        detail: {
          prices: [ 0 ],
          resource: {
            position: 'atf',
            pub_zone: 'testpub.com/combined',
            size: '300x250'
          }
        }
      }));

      expect(bidmanager.addBidResponse.calledOnce).to.be.true;
    })
  })
})
