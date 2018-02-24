import { TestBed, inject } from '@angular/core/testing';
import { Http, BaseRequestOptions, Response, ResponseOptions, RequestMethod } from '@angular/http';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { LoadingService  } from './loading.service';

describe('Service: LoadingService', () => {
  let service: LoadingService = null;
  let backend: MockBackend = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MockBackend,
        BaseRequestOptions,
        {
          provide: Http,
          useFactory: (backendInstance: MockBackend, defaultOptions: BaseRequestOptions) => {
            return new Http(backendInstance, defaultOptions);
          },
          deps: [ MockBackend, BaseRequestOptions ],
        },
        LoadingService,
      ],
    });
  });

  beforeEach(inject([LoadingService, MockBackend], (loadingService: LoadingService, mockBackend: MockBackend) => {
    service = loadingService;
    backend = mockBackend;
  }));

  // --------------------Example------------------------

  // const data = {
  //   'title': 'Book Title',
  //   'author': 'John Smith',
  //   'volumeId': '12345'
  // };

  // const books = {
  //   items: [
  //     {id: '12345', volumeInfo: {title: 'Title'}},
  //     {id: '67890', volumeInfo: {title: 'Another Title'}}
  //   ]
  // };

  // const queryTitle = 'Book Title';

  // it('should call the search api and return the search results', (done) => {
  //   backend.connections.subscribe((connection: MockConnection) => {
  //     const options = new ResponseOptions({
  //       body: JSON.stringify(books)
  //     });
  //     connection.mockRespond(new Response(options));
  //     expect(connection.request.method).toEqual(RequestMethod.Get);
  //     expect(connection.request.url).toEqual(`https://www.googleapis.com/books/v1/volumes?q=${queryTitle}`);
  //   });

  //   service
  //     .searchBooks(queryTitle)
  //     .subscribe((res) => {
  //       expect(res).toEqual(books.items);
  //       done();
  //     });
  // });

});
