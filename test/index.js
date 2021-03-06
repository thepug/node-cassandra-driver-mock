var should = require('should');
var cassandraMock = require('../index');
var Cassandra = require('cassandra-driver').Client;

describe('Mock', function() {
    var cassandra;
    var lastRequestCount;
    var lastConnectionCount;

    beforeEach(function() {
        cassandra = new Cassandra({contactPoints: ['localhost'], keyspace: 'keyspace1'});
        lastRequestCount = cassandraMock.requestCount;
        lastConnectionCount = cassandraMock.connectionCount;
    });

    // This must be the first test
    it('should have zero request and connection counts', function() {
        cassandraMock.requestCount.should.equal(0);
        cassandraMock.connectionCount.should.equal(0);
    });

    it('should one query and one new connection', function(done) {
        cassandra.execute('SOME QUERY;', function(err, result) {
            should.not.exist(err);

            cassandraMock.requestCount.should.equal(lastRequestCount + 1);
            cassandraMock.connectionCount.should.equal(lastConnectionCount + 1);

            done();
        });
    });

    it('should increment 2 request count and 1 connection count for two queries under one connection', function(done) {
        cassandra.execute('SOME QUERY', function(err, result) {
            // Execute another query
            cassandra.execute('ANOTHER QUERY;', function(err, result) {
                should.not.exist(err);

                cassandraMock.requestCount.should.equal(lastRequestCount + 2);
                cassandraMock.connectionCount.should.equal(lastConnectionCount + 1);

                done();
            });
        });
    });

    it('should count prepared queries', function(done) {
        cassandra.execute('QUERY ?;', ['value'], {prepare: true}, function(err, result) {
            should.not.exist(err);

            cassandraMock.requestCount.should.equal(lastRequestCount + 2);  // One prepare query, and then the actual query
            cassandraMock.connectionCount.should.equal(lastConnectionCount + 1);

            done();
        });
    });

    it('should increment 1 request count for a batch', function(done) {
        var batchQuery = [{
            query: 'SOME QUERY'
        }];

        cassandra.batch(batchQuery, function(err, result) {
            should.not.exist(err);

            cassandraMock.requestCount.should.equal(lastRequestCount + batchQuery.length);
            cassandraMock.connectionCount.should.equal(lastConnectionCount + 1);

            done();
        });
    });

    it('should count prepared batch requests', function(done) {
        var batchQuery = [
            { query: 'SOME QUERY' },
            { query: 'SOME QUERY #2' },
        ];

        cassandra.batch(batchQuery, {prepare: true}, function(err, result) {
            should.not.exist(err);

            cassandraMock.requestCount.should.equal(lastRequestCount + batchQuery.length);
            cassandraMock.connectionCount.should.equal(lastConnectionCount + 1);

            done();
        });
    });
});
