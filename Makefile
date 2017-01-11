.PHONY: dist

dist:
	rm -rf $@
	./node_modules/.bin/babel src -d $@
	cp README.md $@
	cp -r .git $@/.git
