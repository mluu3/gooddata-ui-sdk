// Copyright (C) 2007-2013, GoodData(R) Corporation. All rights reserved.
define(['gooddata', 'jquery'], function(sdk, $) {
    describe('sdk', function() {
        describe("async methods:", function() {
            beforeEach(function() {
                this.server = sinon.fakeServer.create();
                this.server.autoRespond = true;
            });

            afterEach(function() {
                this.server.restore();
                delete this.server;
            });

            describe('getProjects', function() {
                it('should reject with 400 when resource fails', function(done) {
                    this.server.respondWith(
                        '/gdc/account/profile/myProfileId/projects',
                        [400, {'Content-Type': 'application/json'}, '']
                    );
                    sdk.getProjects('myProfileId').then(function() {
                        expect().fail('Should reject with 400');
                        done();
                    }, function(err) {
                        expect(err.status).to.be(400);
                        done();
                    });
                });
                it('should return an array of projects', function(done) {
                    this.server.respondWith(
                        '/gdc/account/profile/myProfileId/projects',
                        [200, {'Content-Type': 'application/json'},
                        JSON.stringify({projects: [{project: {meta: {title: 'p1'}}},
                                                {project: {meta: {title: 'p2'}}}]})]
                    );
                    sdk.getProjects('myProfileId').then(function(result) {
                        expect(result.length).to.be(2);
                        expect(result[1].meta.title).to.be('p2');
                        done();
                    });
                });
            });

            describe('getDatasets', function() {
                it('should reject with 400 when resource fails', function(done) {
                    this.server.respondWith(
                        '/gdc/md/myFakeProjectId/query/datasets',
                        [400, {'Content-Type': 'application/json'}, '']
                    );
                    sdk.getDatasets('myFakeProjectId').then(function() {
                        expect().fail('Should reject with 400');
                        done();
                    }, function(err) {
                        expect(err.status).to.be(400);
                        done();
                    });
                });

                it('should return an array of dataSets', function(done) {
                    this.server.respondWith(
                        '/gdc/md/myFakeProjectId/query/datasets',
                        [200, {'Content-Type': 'application/json'},
                        JSON.stringify({query: {entries: [{}, {}]}})]
                    );
                    sdk.getDatasets('myFakeProjectId').then(function(result) {
                        expect(result.length).to.be(2);
                        done();
                    });
                });
            });


            describe('getColorPalette', function() {
                it('should reject with 400 when resource fails', function(done) {
                    this.server.respondWith(
                        '/gdc/projects/myFakeProjectId/styleSettings',
                        [400, {'Content-Type': 'application/json'}, '']
                    );
                    sdk.getColorPalette('myFakeProjectId').then(function() {
                        expect().fail('Should reject with 400');
                        done();
                    }, function(err) {
                        expect(err.status).to.be(400);
                        done();
                    });
                });
                it('should return an array of color objects in the right order', function(done) {
                    this.server.respondWith(
                        '/gdc/projects/myFakeProjectId/styleSettings',
                        [200, {'Content-Type': 'application/json'},
                        JSON.stringify({styleSettings: {chartPalette: [
                            {guid: 'guid1', fill: {r:1, b:1, g:1}},
                            {guid: 'guid2', fill: {r:2, b:2, g:2}}
                        ]}})]
                    );
                    sdk.getColorPalette('myFakeProjectId').then(function(result) {
                        expect(result.length).to.be(2);
                        expect(result[0].r).to.be(1);
                        expect(result[1].r).to.be(2);
                        done();
                    });
                });
            });

            describe('setColorPalette', function() {
                it('should reject with 400 when resource fails', function(done) {
                    this.server.respondWith(
                        '/gdc/projects/myFakeProjectId/styleSettings',
                        [400, {'Content-Type': 'application/json'}, '']
                    );
                    sdk.setColorPalette('myFakeProjectId', []).then(function() {
                        expect().fail('Should reject with 400');
                        done();
                    }, function(err) {
                        expect(err.status).to.be(400);
                        done();
                    });
                });
            });


            describe('getCurrentProjectId', function() {
                it('should resolve with project id', function(done) {
                    this.server.respondWith(
                        'GET', '',
                        [200, {'Content-Type': 'application/json'}, JSON.stringify({bootstrapResource: {current: {project: {links: {self: '/gdc/project/project_hash'}}}}})]
                    );

                    sdk.getCurrentProjectId().then(function(result) {
                        expect(result).to.be('project_hash');
                        done();
                    }, function() {
                        expect().fail('Should resolve with project hash');
                        done();
                    });
                });
            });
       });
    });
});
