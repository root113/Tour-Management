//& api response assertions

/**
 *^ 1. receives `received` (actual value) and `expected` (optional)
 *^ 2. returns `pass` (boolean) and `message` (function)
 *^ 3. message should show both values when test fails
 *^ 4. can be asymetric (different for .not)

 *? usage in tests
 ** expect(response).toBeSuccessfulResponse();
 ** expect(user).toHaveProperties(['id', 'email', 'createdAt']);
*/