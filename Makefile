test:
	@./node_modules/.bin/mocha --require test/support/env --reporter dot --check-leaks ./test/*.js

.PHONY: test